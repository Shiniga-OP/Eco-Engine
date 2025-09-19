const editor = document.getElementById('codigo');
const sugestoes = document.getElementById('auto');


const chaves =
`
function
if()
else
try
catch()
switch() {}
case
break;
default
for()
forEach()
fetch()
while()
return
const
let
var
class
new
extends
console.log();
console.error();

setTimeout(funcao, 1000);
setTimeout(() => {/* codoigo */}, 1000);

setInterval(funcao, 1000);
setInterval(() => {/* codoigo */}, 1000);

addEventListener("click", funcao());
addEventListener("touchstart", ()=>{/* codigo */});
addEventListener("touchmove", ()=>{/* codigo */});
addEventListener("touchend", ()=>{/* codigo */});
addEventListener("input", ()=>{/* codigo */});
addEventListener("keydown", ()=>{/* codigo */});
addEventListener("mousedown", ()=>{/* codigo */});

getElementById("id");
createElement("id");
document
appendChild()
removeChild();
querySelector("id/classe");


engine
add(sprite/particula);
add(sprite/particula, engine.camada);

rm(sprite);
rm(sprite, engine.camada);

novoSprite("caminho/sprite.png");
novoSprite("caminho/sprite.png", engine.camada);

novoBotao("caminho/sprite.png", "click", () => {/* codigo */});
novoBotao("caminho/sprite.png", "loop", () => {/* codigo */});

addBotao(sprite, "click", () => {/* codigo */});
addBotao(sprite, "loop", () => {/* codigo */}, engine.camada);

novoMapa(jsonMapa, listaTiles);
novoMapa(jsonMapa, listaTiles, 0, 0);
novoMapa(jsonMapa, listaTiles, 0, 0, 32);
novoMapa(jsonMapa, listaTiles, 0, 0, 32, engine.camada);

novoTexto();
novoTexto("texto");
novoTexto("texto", "100px");
novoTexto("texto", "100px");
novoTexto("texto", "100px", "blue");
novoTexto("texto", "100px", "blue", engine.camada);

novaCamada();

solidos(sprite1, sprite2);

ajustarTela();
ajustarTela("100px");
ajustarTela("100px", "100px");

rodarAnimacao();
moverPara();
moverParaArray();

repetirAte();
repetirVezes();
esperar();
sempreExecutar();
limpar();
mudarTela();

tamanhoPadrao
renderizacao
camada

ecoEditor
coord
seMove
elemento

Sprite
Sprite("caminho/sprite.png");
Sprite("caminho/sprite.png", 0, 0);
Sprite("caminho/sprite.png", 0, 0, 32, 32);

Particula
Particula("blue");
Particula("null", "caminho/sprite.png");
Particula("null", "caminho/sprite.png", 0, 0);
Particula("null", "caminho/sprite.png", 0, 0, 32, 32);

ArrastavelHtml
ArrastavelHtml("id");
ArrastavelHtml("id", 16);
ArrastavelHtml("id", 16, false);

Camera
Camera(engine, sprite);
Camera(engine, sprite, engine.camada);
ajustar();

Gravidade
Gravidade(sprite);
Gravidade(sprite, 5);
Gravidade(sprite, 5, false);
iniciar();

Android.msg("texto");
Android.arquivar("caminho/arquivo.txt", "conteúdo");
Android.ler("caminho/arquivo.txt");
`
const todasSugestoes = chaves.split("\n");

class DestaqueSintaxe {
    constructor(editor, destaque) {
      this.destaques = [];
      this.editor = document.getElementById(editor);
      this.destaque = document.getElementById(destaque);
      
      this.editor.style = "position: absolute;top: 0;left: 0;right: 0;bottom: 0;background: transparent;color: rgba(0,0,0,0.01);caret-color: black;";
      this.destaque.style = "position: absolute;top: 0;left: 0;right: 0;bottom: 0;";
      
      this.editor.addEventListener("scroll", () => {
        this.destaque.scrollTop = this.editor.scrollTop;
        this.destaque.scrollLeft = this.editor.scrollLeft;
      });
      this.editor.addEventListener("input", () => this.attDestaque());
      this.editor.addEventListener("click", () => this.attDestaque());
    }
    
    refinarHtml(texto) {
      return texto.replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
    }
    
    addCor(destaque) {
      this.destaques.push(destaque);
    }
    
    aplicarD(codigo) {
      codigo = this.refinarHtml(codigo);
      
      codigo = codigo.replace(/\b(function|var|let|const|class)\b/g,
      '<span class="azul">$1</span>');
      
      codigo = codigo.replace(/\b(if|else|for|while|return|new|async|await|try|catch|throw)\b/g,
      '<span class="roxo">$1</span>');
      
      codigo = codigo.replace(/\b(this|console)\b/g,
      '<span class="verde_c">$1</span>');
                            
      codigo = codigo.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="rosa">$1</span>');
      
      for(let i=0; i<this.destaques.length; i++) {
        codigo = codigo.replace(this.destaques[i].palavra/g,
        "<span class="+this.destaques[i].cor+">$1</span>");
      }
      
      codigo = codigo.replace(/(\/\/[^\n]*)/g, '<span class="cinza">$1</span>');
      return codigo;
    }
    
    attDestaque() {
      const selecao = window.getSelection();
      if(selecao.rangeCount==0) return null;
      const range = selecao.getRangeAt(0);
      const preRange = range.cloneRange();
      preRange.selectNodeContents(this.editor);
      preRange.setEnd(range.startContainer, range.startOffset);
      
      const cursorPos = preRange.toString().length;
      const codigo = this.editor.value;
      this.destaque.innerHTML = this.aplicarD(codigo);
    }
  }
  
  const d = new DestaqueSintaxe("codigo", "destaque");

function exibirSugestoes() {
    const posicaoCursor = editor.selectionStart;
    const textoAntes = editor.value.substring(0, posicaoCursor);
    const linhaAtual = textoAntes.split("\n").pop();
    const palavraAtual = linhaAtual.split(/[\s.,;(){}[\]=+-]/).pop();

    if(!palavraAtual) {
        sugestoes.style.display = "none";
        return;
    }
    
    const sugestoesFiltradas = todasSugestoes.filter(item => item.toLowerCase().includes(palavraAtual.toLowerCase()));

    if(sugestoesFiltradas.length==0) {
        sugestoes.style.display="none";
        return;
    }

    sugestoes.innerHTML = sugestoesFiltradas.map(item => `<div class="sugestao">${item}</div>`).join("");

    const coordenadasCursor=obterCoordenadasCursor();
    sugestoes.style.left=coordenadasCursor.esquerda+"px";
    sugestoes.style.top=coordenadasCursor.topo+200+"px";
    sugestoes.style.display="block";

    document.querySelectorAll("#auto .sugestao").forEach(item => {
        item.addEventListener("click", ()=> {
            addSugestao(item.textContent, palavraAtual.length);
        });
    });
}

function addSugestao(texto, tamanhoSubstituir) {
    const inicio = editor.selectionStart-tamanhoSubstituir;
    const fim = editor.selectionStart;

    editor.value = editor.value.substring(0, inicio)+ 
                   texto+ 
                   editor.value.substring(fim);

    editor.selectionStart = editor.selectionEnd = inicio + texto.length;
    
    sugestoes.style.display="none";
    editor.focus();
    d.attDestaque();
}

function obterCoordenadasCursor() {
    const posicaoCursor = editor.selectionStart;
    const divTemporaria = document.createElement("div");
    divTemporaria.textContent = editor.value.substring(0, posicaoCursor);
    
    divTemporaria.style.whiteSpace = "pre-wrap";
    divTemporaria.style.font=getComputedStyle(editor).font;
    divTemporaria.style.width=editor.clientWidth+"px";
    divTemporaria.style.padding=getComputedStyle(editor).padding;
    divTemporaria.style.position="absolute";
    divTemporaria.style.visibility="hidden";
    document.body.appendChild(divTemporaria);

    const retangulo = divTemporaria.getBoundingClientRect();
    const retanguloEditor = editor.getBoundingClientRect();

    document.body.removeChild(divTemporaria);

    return {
        esquerda: retangulo.left-retanguloEditor.left+editor.scrollLeft,
        topo: retangulo.top-retanguloEditor.top+editor.scrollTop
    };
}

editor.addEventListener('input', exibirSugestoes);

editor.addEventListener("keydown", (evento)=> {
    if(evento.key=="Tab") {
        evento.preventDefault();
        document.execCommand('insertText', false, "\t");
    }
});

document.addEventListener("click", (evento)=> {
    if(evento.target != editor && !sugestoes.contains(evento.target)) {
        sugestoes.style.display = "none";
    }
});
