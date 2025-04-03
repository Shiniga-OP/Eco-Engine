const editor = document.getElementById('codigo');
const sugestoes = document.getElementById('auto');


const chaves =
`
""
''
{}
()
[]
function
if
else
try
catch
for
forEach
fetch
while
return
const
let
var
class
new
extends
console.log();
console.error();
setTimeout();
setInterval();
addEventListener
document.getElementById
document.createElement
document
document.body
appendChild()
removeChild()
document.querySelector()

engine
engine.add();
engine.rm();
engine.novoSprite();
engine.novoBotao();
engine.addBotao();
engine.novoMapa();
engine.novoTexto();
engine.novaCamada();
engine.novaParticula();
engine.solidos();
engine.ajustarTela();
engine.rodarAnimacao();
engine.moverPara();
engine.moverParaArray();

engine.repetirAte();
engine.repetirVezes();
engine.esperar();
engine.sempreExecutar();
engine.limpar();
engine.mudarTela();

engine.tamanhoPadrao
engine.renderizacao
engine.camada

ecoEditor.coord
ecoEditor.seMove
ecoEditor.elemento

Sprite
Particula
ArrastavelHtml
Camera
Gravidade
`
const todasSugestoes = chaves.split("\n");

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
    sugestoes.style.top="40px";
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