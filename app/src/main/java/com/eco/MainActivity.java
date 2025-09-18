package com.eco;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;
import android.os.Environment;
import android.view.View;
import android.widget.EditText;
import android.widget.Button;

public class MainActivity extends Activity {

    public EditText cp;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_engine);
		
		cp = findViewById(R.id.cp);
    }
	
	public void mudarEngine(View v) {
		Intent engine = new Intent(this, EngineActivity.class);
		
		engine.putExtra("projeto", cp.getText().toString());
		
		startActivity(engine);
	}
}
