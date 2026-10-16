"use strict";

// Save-game manager (requires shared.js).
//
// The engine mounts IDBFS at SAVE_DIR and populates it from IndexedDB when it
// starts (asm_consts/en.js: FS.mount(IDBFS) + FS.syncfs(true)). IDBFS keeps
// one database per mount point, named after the mount path, with every file
// stored in FILE_DATA as { timestamp, mode, contents } keyed by its full path
// (modules/fs.js). Writing a record in that format before the game starts is
// therefore enough for the engine to see it as a normal save.
(function () {
    const U = window.vcUserData;
    const {
        reqToPromise, txDone, openDB, withDB, expandZips,
        equalBytes, formatSize, formatDate, download, readFile, el, ready,
        createPanel,
    } = U;
    const { t } = window.vcI18n;
    const { setStatus, run } = createPanel("saves-status");

    const SAVE_DIR = "/vc-assets/local/userfiles";
    const SAVE_SLOTS = 8;
    const saveKey = (slot) => `${SAVE_DIR}/GTAVCsf${slot}.b`;

    // Must match IDBFS in modules/fs.js, otherwise opening the database
    // would trigger a version change the engine does not expect.
    const IDBFS_VERSION = 21;
    const IDBFS_STORE = "FILE_DATA";
    const FILE_MODE = 0o100666; // S_IFREG | rw-rw-rw-

    const SAVE_MIN_SIZE = 1024;
    const SAVE_MAX_SIZE = 4 * 1024 * 1024;

    // ─── Data ───────────────────────────────────────────────────────

    // Same schema IDBFS.getDB creates, so it is safe if the game never ran.
    function openSaveDB() {
        return openDB(SAVE_DIR, IDBFS_VERSION, (db, tx) => {
            const store = db.objectStoreNames.contains(IDBFS_STORE)
                ? tx.objectStore(IDBFS_STORE)
                : db.createObjectStore(IDBFS_STORE);
            if (!store.indexNames.contains("timestamp")) {
                store.createIndex("timestamp", "timestamp", { unique: false });
            }
        });
    }

    // GTA VC PC saves end with a 32-bit little-endian sum of every
    // preceding byte; the engine rejects the file if it does not match.
    function validateSave(bytes) {
        if (bytes.length < SAVE_MIN_SIZE) {
            return t("saves.tooSmall", { size: bytes.length });
        }
        if (bytes.length > SAVE_MAX_SIZE) {
            return t("saves.tooLarge", { size: formatSize(bytes.length) });
        }
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const firstBlock = view.getUint32(0, true);
        if (firstBlock === 0 || firstBlock >= bytes.length) {
            return t("saves.invalidBlock");
        }
        let sum = 0;
        const end = bytes.length - 4;
        for (let i = 0; i < end; i++) sum = (sum + bytes[i]) >>> 0;
        const stored = view.getUint32(end, true);
        if (sum !== stored) {
            return t("saves.checksum");
        }
        return null;
    }

    // The first block starts with the save's display name as 24 UTF-16 chars.
    function saveName(bytes) {
        if (!bytes || bytes.length < 52) return "";
        const chars = new Uint16Array(bytes.slice(4, 52).buffer);
        const end = chars.indexOf(0);
        return String.fromCharCode(...(end < 0 ? chars : chars.subarray(0, end))).trim();
    }

    async function readSlots() {
        return withDB(openSaveDB, async (db) => {
            const store = db.transaction(IDBFS_STORE, "readonly").objectStore(IDBFS_STORE);
            const slots = [];
            for (let slot = 1; slot <= SAVE_SLOTS; slot++) {
                slots.push({ slot, entry: await reqToPromise(store.get(saveKey(slot))) });
            }
            return slots;
        });
    }

    // Writes the save and reads it back to confirm the write.
    async function writeSlot(slot, bytes) {
        const key = saveKey(slot);
        await withDB(openSaveDB, async (db) => {
            const tx = db.transaction(IDBFS_STORE, "readwrite");
            tx.objectStore(IDBFS_STORE).put({
                timestamp: new Date(),
                mode: FILE_MODE,
                contents: new Uint8Array(bytes),
            }, key);
            await txDone(tx);
        });
        const written = await withDB(openSaveDB, (db) =>
            reqToPromise(db.transaction(IDBFS_STORE, "readonly").objectStore(IDBFS_STORE).get(key)));
        if (!written || !equalBytes(written.contents, bytes)) {
            throw new Error(t("saves.readBack"));
        }
    }

    async function removeSlot(slot) {
        await withDB(openSaveDB, async (db) => {
            const tx = db.transaction(IDBFS_STORE, "readwrite");
            tx.objectStore(IDBFS_STORE).delete(saveKey(slot));
            await txDone(tx);
        });
    }

    // ─── UI ─────────────────────────────────────────────────────────

    function initSaves() {
        const slotList = document.getElementById("save-slot-list");
        if (!slotList) return;

        const saveInput = document.getElementById("save-file-input");

        let slots = [];
        let targetSlot = 0; // slot chosen by the Import button that opened the picker

        async function refreshSlots() {
            slots = await readSlots();
            slotList.replaceChildren(...slots.map(({ slot, entry }) => {
                const filled = Boolean(entry && entry.contents);
                const info = filled
                    ? `${saveName(entry.contents) || t("saves.unnamed")} · ${formatDate(entry.timestamp)}`
                    : t("saves.empty");
                const button = (label, handler, className = "") =>
                    el("button", { type: "button", className: `userdata-btn ${className}`.trim(), onclick: run(handler) }, label);
                return el("li", { className: "userdata-row" },
                    el("span", { className: "userdata-row-title" }, t("saves.slot", { slot })),
                    el("span", { className: "userdata-row-info" }, info),
                    el("span", { className: "userdata-row-actions" },
                        ...(filled
                            ? [button(t("saves.export"), () => exportSlot(slot)), button(t("saves.remove"), () => removeSave(slot), "userdata-btn-danger")]
                            : [button(t("saves.import"), () => pickSaveFor(slot))])));
            }));
        }

        function pickSaveFor(slot) {
            targetSlot = slot;
            saveInput.click();
        }

        async function importSave(picked, slot) {
            const saves = await expandZips([picked], /\.b$/i, SAVE_MAX_SIZE);
            if (saves.length !== 1) {
                throw new Error(t("saves.multiple", { file: picked.name, count: saves.length, names: saves.map((f) => f.name).join(", ") }));
            }
            const bytes = await readFile(saves[0]);
            const error = validateSave(bytes);
            if (error) throw new Error(`${saves[0].name}: ${error}`);
            await writeSlot(slot, bytes);
            setStatus(t("saves.imported", { name: saveName(bytes) || t("saves.unnamed"), slot }), "ok");
            await refreshSlots();
        }

        async function exportSlot(slot) {
            const entry = slots.find((s) => s.slot === slot)?.entry;
            if (!entry || !entry.contents) throw new Error(t("saves.slotEmpty", { slot }));
            download(entry.contents, `GTAVCsf${slot}.b`);
            setStatus(t("saves.exported", { slot, file: `GTAVCsf${slot}.b` }), "ok");
        }

        async function removeSave(slot) {
            const entry = slots.find((s) => s.slot === slot)?.entry;
            const name = (entry && saveName(entry.contents)) || t("saves.unnamed");
            if (!confirm(t("saves.removeConfirm", { name, slot }))) return;
            await removeSlot(slot);
            setStatus(t("saves.removed", { slot }), "ok");
            await refreshSlots();
        }

        saveInput.addEventListener("change", run(async () => {
            const picked = saveInput.files[0];
            saveInput.value = "";
            if (picked) await importSave(picked, targetSlot);
        }));

        const showStorageError = (err) => {
            console.error("[userdata]", err);
            setStatus(t("userdata.storageError", { message: err && err.message ? err.message : err }), "error");
        };
        refreshSlots().catch(showStorageError);
        window.addEventListener("vc:languagechange", () => refreshSlots().catch(showStorageError));
    }

    Object.assign(U, { validateSave, saveName });
    ready(initSaves);
})();
