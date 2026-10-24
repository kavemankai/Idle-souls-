package io.github.kavemankai.idlesouls;

import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

/**
 * A minimal Capacitor 8 bridge over Android's maintained SQLite implementation.
 * Both the primary save and the previous-good backup are replaced in ONE SQL
 * transaction, guarded by revision and transaction ID. No SharedPreferences or
 * volatile fallback. All game-specific validation is performed again in TS.
 */
@CapacitorPlugin(name = "IdleSoulsSave")
public class DurableSavePlugin extends Plugin {
    private Store helper;

    private static final class Store extends SQLiteOpenHelper {
        Store(android.content.Context context) {
            super(context, "idle-souls-v3.db", null, 1);
        }
        @Override public void onCreate(SQLiteDatabase db) {
            db.execSQL("CREATE TABLE docs (name TEXT PRIMARY KEY, raw TEXT NOT NULL)");
            db.execSQL("CREATE TABLE applied (id TEXT PRIMARY KEY, revision INTEGER NOT NULL)");
        }
        @Override public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
            throw new IllegalStateException("SQLite schema migration has not been defined");
        }
    }

    @Override public void load() {
        helper = new Store(getContext());
    }

    private String read(SQLiteDatabase db, String name) {
        try (Cursor cursor = db.rawQuery("SELECT raw FROM docs WHERE name=?", new String[]{name})) {
            return cursor.moveToFirst() ? cursor.getString(0) : null;
        }
    }

    private void put(SQLiteDatabase db, String name, String raw) {
        android.content.ContentValues values = new android.content.ContentValues();
        values.put("name", name);
        values.put("raw", raw);
        if (db.insertWithOnConflict("docs", null, values, SQLiteDatabase.CONFLICT_REPLACE) < 0)
            throw new IllegalStateException("Cannot persist " + name);
    }

    private int versionOf(String raw) throws Exception {
        JSONObject document = new JSONObject(raw);
        if (!"idle-souls-save".equals(document.getString("format"))) throw new IllegalArgumentException("Invalid save envelope");
        JSONObject data = document.getJSONObject("data");
        if (data.getInt("version") != 3) throw new IllegalArgumentException("Unsupported save format");
        return data.getInt("revision");
    }

    private JSObject respond(String raw, boolean duplicate) {
        JSObject result = new JSObject();
        result.put("raw", raw == null ? JSONObject.NULL : raw);
        result.put("duplicate", duplicate);
        return result;
    }

    @PluginMethod public void readSave(PluginCall call) {
        try {
            SQLiteDatabase db = helper.getReadableDatabase();
            JSObject result = new JSObject();
            String main = read(db, "main");
            String backup = read(db, "backup");
            result.put("raw", main == null ? JSONObject.NULL : main);
            result.put("backup", backup == null ? JSONObject.NULL : backup);
            call.resolve(result);
        } catch (Exception e) { call.reject("Cannot access durable SQLite save", e); }
    }

    @PluginMethod public void initialize(PluginCall call) {
        String raw = call.getString("raw");
        if (raw == null) { call.reject("Missing initial save"); return; }
        try {
            if (versionOf(raw) != 0) throw new IllegalArgumentException("New save must start at revision zero");
            SQLiteDatabase db = helper.getWritableDatabase();
            db.beginTransaction();
            String current;
            try {
                current = read(db, "main");
                if (current == null) { put(db, "main", raw); current = raw; }
                db.setTransactionSuccessful();
            } finally { db.endTransaction(); }
            call.resolve(respond(current, current != raw));
        } catch (Exception e) { call.reject("Cannot initialize SQLite save", e); }
    }

    @PluginMethod public void commit(PluginCall call) {
        String raw = call.getString("raw"), id = call.getString("transactionId");
        Integer revision = call.getInt("expectedRevision");
        if (raw == null || id == null || !id.matches("[A-Za-z0-9][A-Za-z0-9._:-]{0,127}") || revision == null) {
            call.reject("Missing or invalid durable commit fields"); return;
        }
        try {
            if (versionOf(raw) != revision + 1) throw new IllegalArgumentException("New save revision is incorrect");
            SQLiteDatabase db = helper.getWritableDatabase();
            db.beginTransaction();
            boolean duplicate = false;
            String finalRaw;
            try {
                try (Cursor cursor = db.rawQuery("SELECT id FROM applied WHERE id=?", new String[]{id})) {
                    duplicate = cursor.moveToFirst();
                }
                String current = read(db, "main");
                if (current == null) throw new IllegalStateException("No existing durable save");
                if (duplicate) finalRaw = current;
                else {
                    if (versionOf(current) != revision) throw new IllegalStateException("Concurrent revision conflict");
                    put(db, "backup", current);
                    put(db, "main", raw);
                    android.content.ContentValues values = new android.content.ContentValues();
                    values.put("id", id); values.put("revision", revision + 1);
                    if (db.insertWithOnConflict("applied", null, values, SQLiteDatabase.CONFLICT_ABORT) < 0)
                        throw new IllegalStateException("Cannot save transaction identity");
                    finalRaw = raw;
                }
                db.setTransactionSuccessful();
            } finally { db.endTransaction(); }
            call.resolve(respond(finalRaw, duplicate));
        } catch (Exception e) { call.reject("SQLite transaction failed: " + e.getMessage(), e); }
    }

    @PluginMethod public void importSave(PluginCall call) {
        String raw = call.getString("raw");
        Boolean confirmed = call.getBoolean("replaceExisting", false);
        if (raw == null) { call.reject("Missing import"); return; }
        try {
            versionOf(raw);
            SQLiteDatabase db = helper.getWritableDatabase();
            db.beginTransaction();
            try {
                String current = read(db, "main");
                if (current != null && !confirmed) throw new IllegalStateException("Replacement requires explicit confirmation");
                if (current != null) {
                    put(db, "quarantine", current);
                    try { versionOf(current); put(db, "backup", current); }
                    catch (Exception corrupt) { /* Preserve last known good backup */ }
                }
                put(db, "main", raw);
                db.delete("applied", null, null);
                db.setTransactionSuccessful();
            } finally { db.endTransaction(); }
            call.resolve(respond(raw, false));
        } catch (Exception e) { call.reject("Cannot import SQLite save: " + e.getMessage(), e); }
    }
}
