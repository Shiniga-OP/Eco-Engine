eco.canvas.width += 250;
eco.canvas.height += 250;

const tileset = new Image();
tileset.src = "sprs/basico.png";

const editor = new EditorMapas(tileset, eco);

editor.carregarMapa(Android.ler("mapas/mapa.json"));

const objs = eco.obterCamada("colisao");
objs.estatica = true;
const itens = eco.obterCamada("itens");
const morte = eco.obterCamada("morte");
const fim = eco.obterCamada("interacao");
const ui = eco.novaCamada("ui");

eco.zoom = new Zoom("telaJogo", 1.3, false);

const player = eco.add(new Sprite("sprs/basico.png", 16, 0, 16, 16), objs);
player.sx = 0;
player.sy = 0;
player.sEX = 16;
player.sEY = 16;
player.vx = 1.5;
player.vy = 1;

let GRAVIDADE = 0.3;

eco.sempreExecutar(() => {
    player.vy += GRAVIDADE;

    const prevY = player.y;

    player.y += player.vy;

    for(let i = 0; i < objs.sprites.length; i++) {
        if(objs.sprites[i] == player) continue;
        if(eco.solido(player, objs.sprites[i], 0, 0)) {
            if(player.vy > 0 && player.y <= prevY) {
                player.vy = 0.1;
            }
        }
    }
    for(let i = 0; i < morte.sprites.length-1; i++) {
        if(eco.solido(player, morte.sprites[i])) {
            if(GRAVIDADE==0.3) {
                GRAVIDADE = -0.3;
            } else {
                GRAVIDADE = 0.3;
            }
            eco.audio.explosao(0.9);
        }
    }
    for(let i = 0; i < itens.sprites.length; i++) {
        if(eco.encostou(player, itens.sprites[i])) {
            eco.rm(itens.sprites[i], itens);
            eco.audio.coletavel(0.1);
        }
    }
    for(let i = 0; i < fim.sprites.length; i++) {
        if(eco.encostou(player, fim.sprites[i])) {
            eco.audio.ruidoBranco(2, 0.1);
            eco.limpar();
            eco.novoTexto("Você ganhou");
            player.x = 0;
            return;
        }
    }
});

const bDir = new Sprite("sprs/basico.png", 64, 264, 32, 32);
bDir.sx = 16;
bDir.sy = 0;
bDir.sEX = 16;
bDir.sEY = 16;

bDir.pressionado = () => player.x += 1.3;

const bEs = new Sprite("sprs/basico.png", 0, 264, 32, 32);
bEs.sx = 16;
bEs.sy = 0;
bEs.sEX = 16;
bEs.sEY = 16;

bEs.pressionado = () => player.x -= 1.3;

const bCim = new Sprite("sprs/basico.png", 364, 264, 32, 32);
bCim.sx = 16;
bCim.sy = 0;
bCim.sEX = 16;
bCim.sEY = 16;

bCim.pressionado = () => {
    if(Math.abs(player.vy) <= 0.1 && GRAVIDADE==0.3) {
        player.vy = -4;
    } else if(Math.abs(player.vy) <= 0.1 && GRAVIDADE==-0.3) {
        player.vy = 4;
    }
}

eco.add([bDir, bEs, bCim], ui);