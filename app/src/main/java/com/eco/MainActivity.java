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
import java.util.ArrayList;

public class MainActivity extends Activity {
    public static WebView tela;
    public static final int PERMISSAO = 1;
	public static String caminho;
	public Console console = new Console();

    @Override
    protected void onCreate(Bundle s) {
        super.onCreate(s);
        setContentView(R.layout.activity_main);

        tela = findViewById(R.id.tela);

        pedirPermissao();
		System.setOut(console);
		System.setErr(console);
    }
	
	public void iniciar() {
		configurarWebView();
		String caminho = ArquivosUtil.obterArmaExterno()+"/ECO/";
		tela.addJavascriptInterface(new APIJava(this, caminho, console), "Android");
		File ecoDir = new File(caminho);
		if(!ecoDir.exists()) ecoDir.mkdirs();
		if(new File(caminho+"inicio.html").exists()) {
			Toast.makeText(this, "Página inicial carregada", Toast.LENGTH_SHORT).show();
		} else {
			Toast.makeText(this, "Página inicial carregando", Toast.LENGTH_SHORT).show();
			ArquivosUtil.copiarArquivoAssets(this, caminho+"inicio.html", "ECO/inicio.html");
			if(new File(caminho+"inicio.html").exists()) Toast.makeText(this, "Página inicial carregada", Toast.LENGTH_SHORT).show();
			else Toast.makeText(this, "ERRO: arquivo inicio.html não achado", Toast.LENGTH_LONG).show();
		}
		tela.loadUrl("file://"+caminho+"inicio.html");
	}

    public void novoProjeto(String nome) {
		String caminho = ArquivosUtil.obterArmaExterno()+"/ECO/"+nome+"/";
		if(new File(caminho).exists()) {
			return;
		} else {
			ArquivosUtil.criarDir(caminho);
			ArquivosUtil.copiarPastaAssets(this, caminho, "novoProjeto");
			Toast.makeText(this, "projeto criado", Toast.LENGTH_LONG).show();
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
					if(url.startsWith("http://")) {
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
			} else {
				iniciar();
			}
		} else {
			if(this.checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
				this.requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, PERMISSAO);
			} else {
				iniciar();
			}
		}
	}

    @Override
    protected void onActivityResult(int rc, int resultadoC, Intent dados) {
        super.onActivityResult(rc, resultadoC, dados);
        if(rc==PERMISSAO) {
            if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.R && Environment.isExternalStorageManager()) {
                iniciar();
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if(requestCode==PERMISSAO) {
            if(grantResults.length>0&&grantResults[0]==PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(this, "permissão concedida", Toast.LENGTH_SHORT).show();
				iniciar();
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
		private ArquivosUtil arq = new ArquivosUtil();
		private File ecoDir = new File(ArquivosUtil.obterArmaExterno()+"/ECO/");

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
		public void msgLonga(String m) {
			Toast.makeText(ctx, m, Toast.LENGTH_LONG).show();
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
		public boolean arquivoExiste(String caminho) {
			return arq.existeArquivo(pacote+caminho);
		}
		
		@JavascriptInterface
		public void renomear(String caminhoDestino, String caminhoNovo) {
			arq.renomearPasta(caminhoDestino, caminhoNovo);
		}
		
		@JavascriptInterface
		public void copiar(String caminhoDestino, String caminhoNovo) {
			if(ehDir(caminhoDestino) && ehDir(caminhoNovo)) arq.copiarDir(caminhoDestino, caminhoNovo);
			else arq.copiarArquivo(caminhoDestino, caminhoNovo);
		}
		
		@JavascriptInterface
		public boolean ehDir(String caminho) {
			return (new File(pacote+caminho).isDirectory());
		}

		@JavascriptInterface
		public void deletar(String caminho) {
			arq.delete(pacote+caminho);
		}

		@JavascriptInterface
		public String obterLogs() {
			return console.consoleLogs;
		}

		@JavascriptInterface
		public void limparLogs() {
			console.consoleLogs = "";
		}

		@JavascriptInterface
		public String listarArquivos(String caminho) {
			ArrayList<String> lista = new ArrayList<>();
			arq.listarArquivos(pacote + caminho, lista);
			return lista.toString();
		}
		
		@JavascriptInterface
		public void pacoteAdd(String novo) {
			pacote += novo + "/";
		}
		
		@JavascriptInterface
		public void pacoteSub() {
			File anterior = (new File(pacote).getParentFile());
			if(anterior.getAbsolutePath() == ecoDir.getAbsolutePath()) {
				Toast.makeText(ctx, "Acesso ao armazenamento externo não é permitido", Toast.LENGTH_LONG).show();
				return;
			}
			pacote = anterior.getAbsolutePath() + "/";
		}
		
		@JavascriptInterface
		public void criarProjeto(String nome) {
			novoProjeto(nome);
		}
	}
}
