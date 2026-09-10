package com.pocketcampus.app;

import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.content.pm.PackageInfo;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "AppUpdater")
public class AppUpdaterPlugin extends Plugin {
    private static final String RELEASES_API = "https://api.github.com/repos/RMIN06/PocketCampus/releases/latest";
    private static final String APK_NAME = "pocketcampus-release.apk";

    @PluginMethod
    public void checkLatest(PluginCall call) {
        new Thread(() -> {
            try {
                HttpURLConnection connection = (HttpURLConnection) new URL(RELEASES_API).openConnection();
                connection.setRequestProperty("Accept", "application/vnd.github+json");
                connection.setConnectTimeout(8000);
                connection.setReadTimeout(8000);
                BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                StringBuilder body = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) body.append(line);
                JSONObject release = new JSONObject(body.toString());
                String tag = release.optString("tag_name", "");
                String installedVersion = "1.0.0";
                PackageInfo packageInfo = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
                if (packageInfo.versionName != null) installedVersion = packageInfo.versionName;
                String apkUrl = "";
                JSONArray assets = release.optJSONArray("assets");
                if (assets != null) {
                    for (int i = 0; i < assets.length(); i++) {
                        JSONObject asset = assets.getJSONObject(i);
                        if (APK_NAME.equals(asset.optString("name"))) {
                            apkUrl = asset.optString("browser_download_url", "");
                            break;
                        }
                    }
                }
                JSObject result = new JSObject();
                result.put("tag", tag);
                result.put("downloadUrl", apkUrl);
                result.put("updateAvailable", isNewer(tag, installedVersion));
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Could not check GitHub Releases", error);
            }
        }).start();
    }

    private boolean isNewer(String latest, String installed) {
        try {
            String[] a = latest.replace("v", "").split("\\.");
            String[] b = installed.replace("v", "").split("\\.");
            for (int i = 0; i < Math.max(a.length, b.length); i++) {
                int av = i < a.length ? Integer.parseInt(a[i].replaceAll("[^0-9].*", "")) : 0;
                int bv = i < b.length ? Integer.parseInt(b[i].replaceAll("[^0-9].*", "")) : 0;
                if (av != bv) return av > bv;
            }
        } catch (Exception ignored) { }
        return false;
    }

    @PluginMethod
    public void downloadLatest(PluginCall call) {
        String downloadUrl = call.getString("downloadUrl", "");
        if (downloadUrl.isEmpty()) {
            call.reject("No APK download URL was provided");
            return;
        }
        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(downloadUrl));
        request.setTitle("PocketCampus update");
        request.setDescription("Downloading the latest PocketCampus APK");
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setDestinationInExternalFilesDir(getContext(), Environment.DIRECTORY_DOWNLOADS, APK_NAME);
        DownloadManager manager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
        manager.enqueue(request);
        JSObject result = new JSObject();
        result.put("started", true);
        call.resolve(result);
    }
}
