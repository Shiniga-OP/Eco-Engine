const camBotoes = engine.novaCamada();

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
                sprite = engine.add(new Sprite("sprites/grama.png", x, y, grade, grade));
            } else {
                sprite = engine.add(new Sprite("sprites/terra.png", x, y, grade, grade));
            }
            sprite.vx = 1;
            sprite.vy = 1;
            blocos.push(sprite);
        }
    }
    return blocos;
}

const player = engine.add(new Sprite("sprites/grama.png", 0, 0, 32, 32));
player.vx = 1;
player.vy = 1;

const gra = new Gravidade(player);
const blocos = gerar();

engine.camera = new Camera(engine, player, engine.camada);

engine.sempreExecutar(() => {
    for(let i=0; i<blocos.length; i++) {
        if(engine.solido(player, blocos[i])) {
            gra.c = 0;
        }
    }
});

const btDireita = new Sprite("sprites/direita.png", 100, 0, 64, 64);
btDireita.pressionado = () => {
    player.x += 1;
};
engine.addBotao(btDireita, camBotoes);

const btEsquerda = new Sprite("sprites/esquerda.png", 30, 0, 64, 64);
btEsquerda.pressionado = () => {
    player.x -= 1;
};
engine.addBotao(btEsquerda, camBotoes);

const btCima = new Sprite("sprites/cima.png", 30, 64, 64, 64);
btCima.pressionado = ()  => {
    let c = 0;
    for(let i=0; i<10000; i++) {
        gra.estado = false;
        c += 0.001 * 0.0001;
        player.y -= c;
    }
    gra.estado = true;
};
engine.addBotao(btCima, camBotoes);

