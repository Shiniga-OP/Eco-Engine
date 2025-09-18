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

public class EngineActivity extends Activity {

    public static WebView tela;
    public static final int PERMISSAO = 1;
	public String caminho;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

		Intent dados = getIntent();
		this.caminho = dados.getStringExtra("projeto");
		
        tela = findViewById(R.id.tela);
        pedirPermissao();
    }

    public void carregarPagina() {
        try {
			String caminho = ArquivosUtil.obterArmaExterno()+"/.ECO/"+this.caminho+"index.html";
            if(new java.io.File(caminho).exists()) {
                tela.loadUrl(caminho);
            } else {
				ArquivosUtil.criarDir(caminho.replace("index.html", ""));
				
				ArquivosUtil.copiarPastaAssets(this, caminho.replace("index.html", ""), "novoProjeto");
				tela.loadUrl(caminho);
				Toast.makeText(this, "projeto criado", Toast.LENGTH_LONG).show();
            }
            tela.addJavascriptInterface(new APIJava(this, caminho.replace("index.html", "")), "Android");
            tela.getSettings().setJavaScriptEnabled(true);
        } catch(Exception e) {
            tela.loadUrl("file:///android_asset/index.html");
        }
    }

    public void pedirPermissao() {
        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if(!Environment.isExternalStorageManager()) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION);
                intent.setData(Uri.parse("package:" + this.getPackageName()));
                this.startActivityForResult(intent, PERMISSAO);
            } else {
                carregarPagina();
            }
        } else {
            if(this.checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                this.requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, PERMISSAO);
            } else {
                carregarPagina();
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if(requestCode==PERMISSAO) {
            if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.R && Environment.isExternalStorageManager()) {
                carregarPagina();
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if(requestCode==PERMISSAO) {
            if(grantResults.length>0&&grantResults[0]==PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(this, "permissão concedida", Toast.LENGTH_SHORT).show();
                carregarPagina();
            } else {
                Toast.makeText(this, "permissão negada", Toast.LENGTH_SHORT).show();
            }
        }
    }
}

class APIJava {
	public String pacote;
    public Context ctx;
    public ArquivosUtil arq = new ArquivosUtil();

    public APIJava(Context ctx, String pacote) {
        this.ctx = ctx;
		this.pacote = pacote;
    }

    @JavascriptInterface
    public void msg(String m) {
        Toast.makeText(ctx, m, Toast.LENGTH_SHORT).show();
    }
	
	@JavascriptInterface
    public void msg(String m, int tempo) {
        Toast.makeText(ctx, m, tempo).show();
    }

    @JavascriptInterface
    public String ler(String caminho) {
        return arq.lerCaminho(pacote+caminho);
    }

    @JavascriptInterface
    public void arquivar(String caminho, String texto) {
        arq.escreverArquivo(pacote+caminho, texto);
    }

	@JavascriptInterface
    public void mudarTela(String caminho) {
        EngineActivity.tela.loadUrl(pacote+caminho);
    }
}
