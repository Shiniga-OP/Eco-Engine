const camBotoes = eco.novaCamada("ui", 1, true); // camada estática pra interface

// ajusta a tela:
eco.canvas.width += 250;
eco.canvas.height += 250;

function gerar() {
    const blocos = [];
    const grade = 32;
    const yMaximo = 100;
    const xMaximo = 600;
    let altura;
    for(let x=0; x<xMaximo; x += grade) {
        altura = Math.floor(Math.random() * 200 + yMaximo);
        altura = Math.round(altura / grade) * grade;
        for(let y=altura; y<500; y += grade) {
            let sprite;
            if(y<=altura) {
                sprite = eco.add(new Sprite("sprs/grama.png", x, y, grade, grade));
            } else {
                sprite = eco.add(new Sprite("sprs/terra.png", x, y, grade, grade));
            }
            // inicia a velocidade de movimento para colisão:
            sprite.vx = 1;
            sprite.vy = 1;
            blocos.push(sprite);
        }
    }
    return blocos;
}

const player = eco.add(new Sprite("sprs/grama.png", 0, 0, 32, 32));
// velocidade de movimento
player.vx = 1;
player.vy = 1;

const gra = new Gravidade(player);
const blocos = gerar(); // recupera os blocos gerados

eco.camera = new Camera(eco, player);

// inicializa a colisão:
eco.sempreExecutar(() => {
    for(let i=0; i<blocos.length; i++) {
        if(eco.solido(player, blocos[i])) {
            gra.c = 0;
        }
    }
});

// botões de interação:
const btDireita = new Sprite("sprs/direita.png", 100, 0, 64, 64);
btDireita.pressionado = () => {
    player.x += 1;
};
eco.addBotao(btDireita, camBotoes);

const btEsquerda = new Sprite("sprs/esquerda.png", 30, 0, 64, 64);
btEsquerda.pressionado = () => {
    player.x -= 1;
};
eco.addBotao(btEsquerda, camBotoes);

const btCima = new Sprite("sprs/cima.png", 30, 64, 64, 64);
btCima.pressionado = ()  => {
    let c = 0;
    for(let i=0; i<10000; i++) {
        gra.estado = false;
        c += 0.001 * 0.0001;
        player.y -= c;
    }
    gra.estado = true;
};
eco.addBotao(btCima, camBotoes);
