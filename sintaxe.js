const editor = document.getElementById('codigo');
const sugestoes = document.getElementById('auto');


const chaves =
`
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
console.log
console.error
setTimeout
setInterval
addEventListener
getElementById
createElement
document
document.body
appendChild
removeChild
querySelector

add
novoSprite
novoBotao
novoMapa
novaCamada
novaParticula
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
    
    .filter(item => item.toLowerCase()
    .includes(palavraAtual.toLowerCase()));

    if(todasSugestoes.length==0) {
        sugestoes.style.display="none";
        return;
    }

    sugestoes.innerHTML = todasSugestoes.map(item => `<div class="sugestao">${item}</div>`).join("");

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
        document.execCommand('insertText', false, "");
    }
});

document.addEventListener("click", (evento)=> {
    if(evento.target != editor && !sugestoes.contains(evento.target)) {
        sugestoes.style.display = "none";
    }
});