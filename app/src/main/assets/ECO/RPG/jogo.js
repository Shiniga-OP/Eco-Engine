const tileset = new Image();
tileset.src = "sprs/basico.png";

const editor = new EditorMapas(tileset, eco);
editor.carregarMapa(Android.ler("mapas/mapa.json"));

eco.canvas.width += 250;
eco.canvas.height += 250;

function iniciar() {
  const ui = eco.novaCamada("ui", 3, true);
  const objs = eco.obterCamada("colisao");
  const itens = eco.obterCamada("itens");
  
  let pontos = 0;
  const total = itens.sprites.length;
  
  const player = {
    x: 200, y: 200,
    escalaX: 20, escalaY: 20,
    vx: 1.5, vy: 1.5,
    cor: "red"
  };
  const btDireita = {
    x: 200, y: 100,
    escalaX: 50, escalaY: 50,
    cor: "blue",
    pressionado: () => {
      player.x += player.vx;
      if(player.vx < 10) player.vx += 0.5;
    },
    noFim: () => player.vx = 1
  };
  const btEsquerda = {
    x: 100, y: 100,
    escalaX: 50, escalaY: 50,
    cor: "blue",
    pressionado: () => {
      player.x -= player.vx;
      if(player.vx < 10) player.vx += 0.5;
    },
    noFim: () => player.vx = 1
  };
  const btCima = {
    x: 150, y: 50,
    escalaX: 50, escalaY: 50,
    cor: "blue",
    pressionado: () => {
      player.y -= player.vy;
      if(player.vy < 10) player.vy += 0.5;
    },
    noFim: () => player.vy = 1
  };
  const btBaixo = {
    x: 150, y: 150,
    escalaX: 50, escalaY: 50,
    cor: "blue",
    pressionado: () => {
      player.y += player.vy;
      if(player.vy < 10) player.vy += 0.5;
    },
    noFim: () => player.vy = 1
  };
  eco.addBotao(btDireita, ui);
  eco.addBotao(btBaixo, ui);
  eco.addBotao(btCima, ui);
  eco.addBotao(btEsquerda, ui);
  
  eco.add(player, objs);
  
  eco.sempreExecutar(() => {
    for(let i = 0; i < objs.sprites.length; i++) {
      if(objs.sprites[i] == player) continue;
      eco.solido(player, objs.sprites[i], 0, 0);
    }
  });
  eco.sempreExecutar(() => {
    for(let i = 0; i < itens.sprites.length; i++) {
      if(eco.solido(player, itens.sprites[i], 1, 0)) {
        eco.audio.coletavel(1);
        eco.rm(itens.sprites[i], itens);
        pontos += 1;
        if(pontos >= total) ganhou(pontos, total);
      }
    }
  });
  eco.camera = new Camera(eco, player);
}

function ganhou(pontos, tam) {
  eco.novoTexto("você ganhou");
  console.log("pontos: "+pontos+", itens: "+tam);
  eco.audio.ruidoBranco(5);
}

iniciar();