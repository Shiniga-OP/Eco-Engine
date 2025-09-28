package com.eco;

import android.app.Activity;
import android.content.Context;
import android.view.ViewGroup;
import android.widget.EditText;
import android.os.Environment;
import android.view.View;
import android.widget.ArrayAdapter;
import android.view.LayoutInflater;
import android.widget.ImageView;
import android.widget.TextView;
import java.io.File;
import java.io.IOException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.ArrayList;
import java.util.List;
import java.io.InputStream;
import android.widget.Toast;

public class Uteis {}

class Log {
    public static void logEditText(String erroMensagem, Activity activity) {
        ViewGroup layout = activity.findViewById(android.R.id.content);
        
        final EditText erroTexto = new EditText(activity);
        erroTexto.setText(erroMensagem);
        
        layout.addView(erroTexto);
     }
}

class Views {
    public static ViewGroup obterXmlAtual(Activity activity) {
        return activity.findViewById(android.R.id.content);
    }
}

class Adapter extends ArrayAdapter<String> {
    private Context contexto;
    private List<String> listaItens;

    public Adapter(Context contexto, List<String> listaItens) {
        super(contexto, 0, listaItens);
        this.contexto = contexto;
        this.listaItens = listaItens;
    }

    @Override
    public View getView(int posicao, View viewConvertido, ViewGroup parente) {
        /*
        if(viewConvertido==null) {
            viewConvertido = LayoutInflater.from(contexto).inflate(R.layout.arquivos, parente, false);
        }

        ImageView itemImagem  = viewConvertido.findViewById(R.id.item_imagem);
        itemImagem.setImageResource(R.drawable.pasta);

        TextView itemTexto = viewConvertido.findViewById(R.id.item_texto);
        itemTexto.setText(listaItens.get(posicao));

        return viewConvertido; */
        return null;
    }
}

class ArquivosUtil {
    public static void criarArquivo(String caminho) {
        int ultimoPasso = caminho.lastIndexOf(File.separator);
        if(ultimoPasso > 0) {
            String dirCaminho = caminho.substring(0, ultimoPasso);
            criarDir(dirCaminho);
        }
        File arquivo = new File(caminho);
        try {
            if(!arquivo.exists()) arquivo.createNewFile();
        } catch(IOException e) {
            e.printStackTrace();
        }
    }

    public static String lerCaminho(String caminho) {
        if(!existeArquivo(caminho)) return "não achado.";

        StringBuilder sb = new StringBuilder();
        FileReader fr = null;

        try {
            fr = new FileReader(new File(caminho));

            char[] buff = new char[1024];
            int tamanho = 0;

            while((tamanho = fr.read(buff)) > 0) {
                sb.append(new String(buff, 0, tamanho));
            }
        } catch(IOException e) {
            e.printStackTrace();
        } finally {
            if(fr != null) {
                try {
                    fr.close();
                } catch(Exception e) {
                    e.printStackTrace();
                }
            }
        }
        return sb.toString();
    }

    public static boolean escreverArquivo(String caminho, String texto) {
        criarArquivo(caminho);
        FileWriter escritor = null;

        try {
            escritor = new FileWriter(new File(caminho), false);
            escritor.write(texto);
            escritor.flush();
        } catch(IOException e) {
            e.printStackTrace();
        } finally {
            try {
                if(escritor != null) escritor.close();
				return true;
            } catch(IOException e) {
                e.printStackTrace();
				return false;
            }
        }
    }
	
	public static void copiarPastaAssets(Context contexto, String caminhoDestino, String caminhoAssets) {
		try {
			String[] arquivos = contexto.getAssets().list(caminhoAssets);
			
			if(arquivos != null && arquivos.length > 0) {
				File pastaDestino = new File(caminhoDestino);
				if(!pastaDestino.exists()) pastaDestino.mkdirs();

				for(String arquivo : arquivos) {
					String novoCaminhoAssets = caminhoAssets + "/" + arquivo;
					String novoCaminhoDestino = caminhoDestino + "/" + arquivo;

					if(contexto.getAssets().list(novoCaminhoAssets).length > 0) copiarPastaAssets(contexto, novoCaminhoDestino, novoCaminhoAssets);
					else copiarArquivoAssets(contexto, novoCaminhoDestino, novoCaminhoAssets);
				}
			} else {
				Toast.makeText(contexto, "ERRO: arquivos não achados, quantidade de arquivos: "+arquivos.length, Toast.LENGTH_LONG).show();
			}
		} catch(IOException e) {
			Toast.makeText(contexto, "ERRO: "+e, Toast.LENGTH_LONG).show();
		}
	}
	
	public static void copiarArquivoAssets(Context ctx, String caminhoDestino, String caminhoAssets) {
		try {
			if(!existeArqAssets(ctx, caminhoAssets)) {
				Toast.makeText(ctx, "ERRO: arquivo não achado nos assets: "+ caminhoAssets, Toast.LENGTH_LONG).show();
				return;
			}
			InputStream is = ctx.getAssets().open(caminhoAssets);
			FileOutputStream fos = new FileOutputStream(new File(caminhoDestino));

			byte[] buffer = new byte[1024];
			int bytesConta;

			while((bytesConta = is.read(buffer)) != -1) fos.write(buffer, 0, bytesConta);

			fos.close();
			is.close();
		} catch (IOException e) {
			Toast.makeText(ctx, "ERRO: "+e, Toast.LENGTH_LONG).show();
		}
	}
	
	public static boolean existeArqAssets(Context contexto, String caminhoAssets) {
		try {
			InputStream is = contexto.getAssets().open(caminhoAssets);
			if(is != null) {
				is.close();
				return true;
			}
		} catch (IOException e) {
			return false;
		}
		return false;
	}
	
	public static boolean renomear(String caminhoAntigo, String caminhoNovo) {
		File pastaAntiga = new File(caminhoAntigo);
		File pastaNova = new File(caminhoNovo);

		return pastaAntiga.exists() && pastaAntiga.renameTo(pastaNova);
	}
	
	public static void arquivarAssets(String caminhoExterno, InputStream is) {
		try {
			FileOutputStream fos = new FileOutputStream(new File(caminhoExterno));

			byte[] buffer = new byte[1024];
			int bytesConta;

			while((bytesConta = is.read(buffer)) != -1) fos.write(buffer, 0, bytesConta);

			fos.close();
			is.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

    public static void copiarArquivo(String caminhoCP, String caminhoCL) {
        if(!existeArquivo(caminhoCP)) return;
        criarArquivo(caminhoCL);

        FileInputStream fis = null;
        FileOutputStream fos = null;

        try {
            fis = new FileInputStream(caminhoCP);
            fos = new FileOutputStream(caminhoCL, false);

            byte[] buff = new byte[1024];
            int tamanho = 0;

            while((tamanho = fis.read(buff)) > 0) {
                fos.write(buff, 0, tamanho);
            }
        } catch(IOException e) {
            e.printStackTrace();
        } finally {
            if(fis != null) {
                try {
                    fis.close();
                } catch(IOException e) {
                    e.printStackTrace();
                }
            }
            if(fos != null) {
                try {
                    fos.close();
                } catch(IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    public static void copiarDir(String caminhoCP, String caminhoCL) {
        File arquivoCP = new File(caminhoCP);
        File[] arquivos = arquivoCP.listFiles();
        File arquivoCL = new File(caminhoCL);
		
        if(!arquivoCL.exists()) arquivoCL.mkdirs();
        
        for(File arquivo : arquivos) {
            if(arquivo.isFile()) {
                copiarArquivo(arquivo.getPath(), caminhoCL + "/" + arquivo.getName());
            } else if(arquivo.isDirectory()) {
                copiarDir(arquivo.getPath(), caminhoCL + "/" + arquivo.getName());
            }
        }
    }

    public static void moverArquivo(String caminhoCT, String caminhoCL) {
        copiarArquivo(caminhoCT, caminhoCL);
        delete(caminhoCT);
    }

    public static void delete(String caminho) {
        File arquivo = new File(caminho);

        if(!arquivo.exists()) return;
        if(arquivo.isFile()) {
            arquivo.delete();
            return;
        }

        File[] arquivos = arquivo.listFiles();

        if(arquivos != null) {
            for(File subArquivo : arquivos) {
                if(subArquivo.isDirectory()) delete(subArquivo.getAbsolutePath());
                if(subArquivo.isFile()) subArquivo.delete();
            }
        }
        arquivo.delete();
    }

    public static boolean existeArquivo(String caminho) {
        File arquivo = new File(caminho);
        return arquivo.exists();
    }

    public static void criarDir(String caminho) {
        if(!existeArquivo(caminho)) {
            File arquivo = new File(caminho);
            arquivo.mkdirs();
        }
    }

    public static void listarArquivos(String caminho, ArrayList<String> lista) {
        File dir = new File(caminho);
        if(!dir.exists() || dir.isFile()) return;

        File[] listaArquivos = dir.listFiles();
        if(listaArquivos == null || listaArquivos.length <= 0) return;

        if(lista==null) return;
        lista.clear();
        for(File arquivo : listaArquivos) {
            lista.add(arquivo.getName());
        }
    }

    public static void listarArquivosAbsoluto(String caminho, ArrayList<String> lista) {
        File dir = new File(caminho);
        if(!dir.exists() || dir.isFile()) return;

        File[] listaArquivos = dir.listFiles();
        if(listaArquivos==null || listaArquivos.length <= 0) return;

        if(lista==null) return;
        lista.clear();
        for(File arquivo : listaArquivos) {
            lista.add(arquivo.getAbsolutePath());
        }
    }

    public static boolean eDiretorio(String caminho) {
        if(!existeArquivo(caminho)) return false;
        return new File(caminho).isDirectory();
    }

    public static boolean eArquivo(String caminho) {
        if(!existeArquivo(caminho)) return false;
        return new File(caminho).isFile();
    }

    public static long obterTamanhoArquivo(String caminho) {
        if(!existeArquivo(caminho)) return 0;
        return new File(caminho).length();
    }

    public static String obterArmaExterno() {
        return Environment.getExternalStorageDirectory().getAbsolutePath();
    }

    public static String obterPacoteDados(Context contexto) {
        return contexto.getExternalFilesDir(null).getAbsolutePath();
    }

    public static String obterDiretorioPublico(String tipo) {
        return Environment.getExternalStoragePublicDirectory(tipo).getAbsolutePath();
    }
}
