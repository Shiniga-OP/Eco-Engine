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
import java.io.File;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebChromeClient;
import java.io.PrintStream;
import java.io.ByteArrayOutputStream;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

public class EngineActivity extends Activity {
    public static WebView tela;
    public static final int PERMISSAO = 1;
	public String caminho;
	public Console console = new Console();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

		Intent dados = getIntent();
		this.caminho = dados.getStringExtra("projeto");

        tela = findViewById(R.id.tela);

		tela.getSettings().setAllowFileAccess(true);
		tela.getSettings().setAllowContentAccess(true);

		if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
			tela.getSettings().setAllowFileAccessFromFileURLs(true);
			tela.getSettings().setAllowUniversalAccessFromFileURLs(true);
		}
        pedirPermissao();
		System.setOut(console);
		System.setErr(console);
    }

    public void carregarPagina() {
		try {
			configurarWebView();
			String caminho = ArquivosUtil.obterArmaExterno()+"/.ECO/"+this.caminho+"index.html";
			if(new File(caminho).exists()) {
				tela.loadUrl("file://" + caminho);
			} else {
				ArquivosUtil.criarDir(caminho.replace("index.html", ""));
				ArquivosUtil.copiarPastaAssets(this, caminho.replace("index.html", ""), "novoProjeto");
				tela.loadUrl("file://" + caminho);
				Toast.makeText(this, "projeto criado", Toast.LENGTH_LONG).show();
			}
			tela.addJavascriptInterface(new APIJava(this, caminho.replace("index.html", ""), console), "Android");
		} catch(Exception e) {
			tela.loadUrl("file:///android_asset/index.html");
		}
	}

	public void configurarWebView() {
		tela.getSettings().setJavaScriptEnabled(true);
		tela.getSettings().setAllowFileAccess(true);
		tela.getSettings().setAllowContentAccess(true);
		tela.getSettings().setSupportZoom(true);
		if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
			tela.setWebContentsDebuggingEnabled(true);
		}
		if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
			tela.getSettings().setAllowFileAccessFromFileURLs(true);
			tela.getSettings().setAllowUniversalAccessFromFileURLs(true);
		}

		tela.setWebViewClient(new WebViewClient() {
				@Override
				public boolean shouldOverrideUrlLoading(WebView webview, WebResourceRequest requisicao) {
					String url = requisicao.getUrl().toString();
					return tratarNavegacao(url);
				}

				@Override
				public boolean shouldOverrideUrlLoading(WebView webview, String url) {
					return tratarNavegacao(url);
				}

				public boolean tratarNavegacao(String url) {
					if(url.startsWith("http://") || url.startsWith("https://")) {
						Intent intencao = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
						startActivity(intencao);
						return true;
					}
					return false;
				}
			});

		tela.setWebChromeClient(new WebChromeClient() {
				@Override
				public boolean onConsoleMessage(ConsoleMessage msg) {
					console.consoleLogs += msg.message() + " \n";
					return true;
				}
			});
		tela.getSettings().setDomStorageEnabled(true);
		tela.getSettings().setDatabaseEnabled(true);
		if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) tela.getSettings().setAllowFileAccess(true);
	}

    public void pedirPermissao() {
        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if(!Environment.isExternalStorageManager()) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION);
                intent.setData(Uri.parse("package:" + this.getPackageName()));
                this.startActivityForResult(intent, PERMISSAO);
            } else  carregarPagina();
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
	
	public class Console extends PrintStream {
		public String consoleLogs = "";
		public Console() {
			super(new ByteArrayOutputStream());
		}

		@Override
		public void println(Object o) {
			consoleLogs += String.valueOf(o) + "\n";
		}
	}

	public class APIJava {
		public String pacote;
		public Context ctx;
		public Console console;
		public ArquivosUtil arq = new ArquivosUtil();

		public APIJava(Context ctx, String pacote, Console console) {
			this.ctx = ctx;
			this.pacote = pacote;
			this.console = console;
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
		public void deletar(String caminho, String texto) {
			arq.deleteArquivo(pacote+caminho);
		}
		
		@JavascriptInterface
		public String obterLogs() {
			return console.consoleLogs;
		}
		
		@JavascriptInterface
		public void limparLogs() {
			console.consoleLogs = "";
		}
	}
}
