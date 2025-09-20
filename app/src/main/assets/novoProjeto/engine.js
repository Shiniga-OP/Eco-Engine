class Engine {
  constructor(canvasId, renderAutomatico=true, canvasCompleto=false) {
    if(canvasId) this.canvas = document.getElementById(canvasId);
    else {
      this.canvas = document.querySelector("canvas");
      if(!this.canvas) {
        this.canvas = document.createElement("canvas");
        document.body.appendChild(this.canvas);
      }
    }
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.texto = [];
    this.camada = [];
    this.camadas = [];
    this.camadas.push(this.camada);
    this.renderizacao = renderAutomatico;
    this.tamPadrao = 32;
    this.camera;
    this.zoom;
    
    if(this.renderizacao) this.renderizar();
    if(canvasCompleto) this.ajustarTela();
  }
  
  obterCoordGlobal(e) {
    const toque = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = toque.clientX - rect.left;
    const y = toque.clientY - rect.top;

    if(this.zoom) {
      const mundoX = (x - this.zoom.panX) / this.zoom.escala;
      const mundoY = (y - this.zoom.panY) / this.zoom.escala;
      return { x: mundoX, y: mundoY };
    }
    return { x, y };
  }
  
  novaCamada(renderizarAutomatico=true) {
    const camada = [];
    this.camadas.push(camada);
    return camada;
  }
  
  novoSprite(caminho, camada=this.camada) {
    const sprite = new Sprite(caminho, 0, 0, this.tamPadrao, this.tamPadrao);
    camada.push(sprite);
    return sprite;
  }
  
  add(sprite, camada=this.camada) {
    if(Array.isArray(sprite)) {
      for(let i = 0; i < sprite.length; i++) camada.push(sprite[i]);
    } else camada.push(sprite);
    return sprite;
  }
  
  rm(sprite, camada=this.camada) {
    const i = camada.indexOf(sprite);
    if(i !== -1) {
      camada.splice(i, 1);
    }
  }
  
  rodarAnimacao(alvo=Sprite, animacao=[], repetir=1, intervalo=0.5, inicio=0) {
    let frame = inicio;
    alvo.imagem.src = animacao[frame];
    frame++;
    
    setTimeout(() => {
      if(frame < animacao.length) {
        requestAnimationFrame(() => this.rodarAnimacao(alvo, animacao, repetir, intervalo, frame));
      }
    }, intervalo * 1000);
  }
  
  renderizar() {
    this.ctx.save();

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if(this.zoom && !this.zoom.ctx) this.zoom.ctx = this.ctx;
    if(this.zoom) this.zoom.aplicarTransformacao();
    if(this.camera) this.camera.att();

    for(const camada of this.camadas) {
      for(const sprite of camada) {
        try {
          if(sprite.sx != null  && sprite.imagem.complete) {
              this.ctx.drawImage(
                sprite.imagem,
                sprite.sx, sprite.sy, sprite.sEX, sprite.sEY,
                sprite.x, sprite.y, sprite.escalaX, sprite.escalaY);
            } else if(sprite.imagem != null && sprite.imagem.complete) {
              this.ctx.drawImage(
                sprite.imagem,
                sprite.x, sprite.y,
                sprite.escalaX, sprite.escalaY);
            } else if(sprite.cor != null && sprite.texto == null) {
              this.ctx.fillStyle = sprite.cor;
              this.ctx.fillRect(
                sprite.x, sprite.y,
                sprite.escalaX, sprite.escalaY);
            } else if(sprite.texto) {
              if(sprite.texto.includes("\n")) {
                const array = sprite.texto.split("\n");
                for(let i = 0; i < array.length; i++) {
                  this.ctx.fillStyle = sprite.cor;
                  this.ctx.font = sprite.escala;
                  this.ctx.fillText(
                    array[i],
                    sprite.x, sprite.y+i*parseInt(sprite.escala, 10),
                    sprite.escalaX, sprite.escalaY);
                }
              } else {
                this.ctx.fillStyle = sprite.cor;
                this.ctx.font = sprite.escala;
                this.ctx.fillText(
                  sprite.texto,
                  sprite.x, sprite.y,
                  sprite.escalaX, sprite.escalaY);
              }
            } else if(sprite instanceof Particula) {
              sprite.desenhar(this.ctx);
              sprite.atualizar(this.canvas.width, this.canvas.height);
            }
        } catch(err) {
          if(err instanceof DOMException) {
            alert("Erro DOMException ao desenhar sprite (ver console).");
            console.error("DOMException ao desenhar sprite:", sprite, err);
            console.error("sprite: ", sprite.imagem.src);
            throw err;
          } else throw err;
        }
      }
    }
    this.ctx.restore();
    requestAnimationFrame(() => this.renderizar());
  }
  
  solido(s1, s2, elasticidade=0.8, atrito=0.3) {
    if(s1.x + s1.escalaX <= s2.x || 
        s1.x >= s2.x + s2.escalaX || 
        s1.y + s1.escalaY <= s2.y || 
        s1.y >= s2.y + s2.escalaY) {
        return false;
    }
    const sobreX = Math.min(s1.x + s1.escalaX, s2.x + s2.escalaX) - Math.max(s1.x, s2.x);
    const sobreY = Math.min(s1.y + s1.escalaY, s2.y + s2.escalaY) - Math.max(s1.y, s2.y);
    if(sobreX < sobreY) {
        if(s1.x < s2.x) s1.x = s2.x - s1.escalaX;
        else s1.x = s2.x + s2.escalaX;
        s1.vx = -s1.vx * elasticidade;
    } else {
        if(s1.y < s2.y) s1.y = s2.y - s1.escalaY;
        else s1.y = s2.y + s2.escalaY;
        s1.vy = -s1.vy * elasticidade;
    }
    return true;
  }
  
  novoMapa(json, tiles, x=0, y=0, escala=16, camada=this.camada) {
    const solidos = [];
    function verificacao(tile, item, listaSolidos) {
      if(listaSolidos.includes(tile)) solidos.push(item);
    }
    for(let linha=0; linha<json.mapa.length; linha++) {
      for(let coluna=0; coluna<json.mapa[linha].length; coluna++) {
        const tipoTile = json.mapa[linha][coluna];
        if(tipoTile != "ar") {
          const tile = tiles[tipoTile];
          const novoTile = this.add(new Sprite(tile, x+coluna*escala, y+linha*escala, escala, escala), camada);
          verificacao(tipoTile, novoTile, json.colisao);
        }
      }
    }
    return solidos;
  }
  
  novoTexto(escrita, tamanho="30px", coloracao="blue", camada=this.camada) {
    const texto = {
      texto: escrita,
      cor: coloracao,
      x: 100,
      y: 100,
      escala: tamanho+" Ariel",
      escalaX: 228,
      escalaY: 32
    };
    camada.push(texto);
    return texto;
  }
  
  novoBotao(caminho, camada=this.camada) {
    const sprite = new Sprite(caminho);
    this.addBotao(sprite, camada);
  }
    
  addBotao(sprite, camada=this.camada) {
    let pressionado = false;
    if(sprite.click) {
      this.canvas.addEventListener('touchstart', (evento) => {
        evento.preventDefault();
        const coords = this.obterCoordGlobal(evento);
        
        if(
          coords.x >= sprite.x &&
          coords.x <= sprite.x + sprite.escalaX &&
          coords.y >= sprite.y &&
          coords.y <= sprite.y + sprite.escalaY) {
            sprite.click(evento);
          }
      });
    }
    if(sprite.pressionado) {
      this.canvas.addEventListener('touchstart', (evento) => {
        evento.preventDefault();
        const coords = this.obterCoordGlobal(evento);
        
        if(
          coords.x >= sprite.x &&
          coords.x <= sprite.x + sprite.escalaX &&
          coords.y >= sprite.y &&
          coords.y <= sprite.y + sprite.escalaY
          ) {
            pressionado = true;
            
            loop(sprite.pressionado);
            
            function loop(funcao) {
              setTimeout(() => {
                if(pressionado) {
                  funcao();
                  requestAnimationFrame(() => loop(funcao));
                }
              });
            }
          }
      });
    }
    this.canvas.addEventListener('touchend', (evento) => {
      pressionado = false;
      if(sprite.noFim) sprite.noFim();
    });
    camada.push(sprite);
    return sprite;
  }
  
  ajustarTela(escalaX="100%", escalaY="100%") {
    document.documentElement.style.margin = 0;
    document.documentElement.style.padding = 0;
    document.documentElement.style.width = escalaX;
    document.documentElement.style.height = escalaY;
    document.documentElement.style.overflow = "hidden";
    
    this.canvas.style.display = "block";
    this.canvas.style.position = "absolute";
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  moverPara(objeto, xDestino, yDestino, velocidade) {
    const dx = xDestino - objeto.x;
    const dy = yDestino - objeto.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    
    const passoX = (dx / distancia) * velocidade;
    const passoY = (dy / distancia) * velocidade;
    
    const mover = () => {
      if(Math.abs(objeto.x - xDestino) < Math.abs(passoX) && Math.abs(objeto.y - yDestino) < Math.abs(passoY)) {
        objeto.x = xDestino;
        objeto.y = yDestino;
      } else {
        objeto.x += passoX;
        objeto.y += passoY;
      requestAnimationFrame(mover);
    }
  };
  mover();
}

 moverParaArray(objeto, array) {
  function moverParaPonto(i) {
    if(i>=array.length) return;

    const dx = array[i].x - objeto.x;
    const dy = array[i].y - objeto.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    const passoX = (dx / distancia) * array[i].velo;
    const passoY = (dy / distancia) * array[i].velo;

    const mover = () => {
      if(Math.abs(objeto.x - array[i].x) < Math.abs(passoX) && Math.abs(objeto.y - array[i].y) < Math.abs(passoY)) {
        objeto.x = array[i].x;
        objeto.y = array[i].y;
        moverParaPonto(i + 1);
      } else {
        objeto.x += passoX;
        objeto.y += passoY;
        requestAnimationFrame(mover);
      }
    };
    mover();
  }
  moverParaPonto(0);
}
  
  repetirAte(condicao, funcao) {
    while(condicao) {
      funcao();
    }
  }
  
  repetirVezes(quantidade, funcao) {
    for(let i=0; i<quantidade; i++) {
      if(funcao) funcao();
    }
  }
  
  esperar(tempo=1, funcao) {
    setTimeout(() => {
      funcao();
    }, tempo*1000);
  }
  
  sempreExecutar(funcao, intervalo=0) {
    setTimeout(() => {
      funcao();
      requestAnimationFrame(() => this.sempreExecutar(funcao, intervalo));
    }, intervalo*1000)
  }
  
  limpar() {
    this.camadas = [];
    this.camada = [];
    this.camadas.push(this.camada);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  mudarTela(tela) {
    window.location.href = tela;
  }
}

class Sprite {
  constructor(caminho, x=0, y=0, escalaX=32, escalaY=32) {
    this.imagem;
    if(caminho != null) {
      this.imagem = new Image();
      this.imagem.src = caminho;
    }
    this.x = x;
    this.y = y;
    this.escalaX = escalaX;
    this.escalaY = escalaY;
  }
}

class Gravidade {
  constructor(objeto, forca=5, estado=true) {
    this.objeto = objeto;
    this.forca = forca;
    this.gradiante = 0.01;
    this.c = 0;
    this.limite = 10;
    this.estado = estado;
    this.iniciar();
  }
  
  iniciar() {
    this.objeto.y += this.c;
    if(this.c<=this.limite && this.estado==true) this.c += this.gradiante * this.forca;
    requestAnimationFrame(() => this.iniciar())
  }
}

class Particula {
    constructor(cor, caminho, x=0, y=0, escalaX=32, escalaY=32) {
        this.cor = cor;
        this.sprite = new Sprite(caminho, x, y, escalaX, escalaY);
        this.velo = 10;
        this.vida = 100;
        this.tamanho = Math.random() * 5 + 2;
    }

    att(larguraCanvas, alturaCanvas) {
      this.comportamento();
        this.vida -= 1;
        if(this.sprite.x < 0 || this.sprite.x > larguraCanvas || this.sprite.y < 0 || this.sprite.y > alturaCanvas || this.vida <= 0) {
            return false;
        }
        return true;
    }
    
    comportamento() {
      if(Math.random()*10<=5) this.sprite.x += Math.random()*5;
      else this.sprite.y += Math.random()*5;
      if(Math.random()*10<=5) this.sprite.x -= Math.random()*5;
      else this.sprite.y -= Math.random()*5;
    }

    desenhar(ctx) {
      if(this.sprite !== null) {
        ctx.drawImage(
          this.sprite.imagem, this.sprite.x, this.sprite.y,
          this.sprite.escalaX, this.sprite.escalaY
        );
      }
      if(this.cor !== null) {
        ctx.fillStyle = this.cor;
        ctx.beginPath();
        ctx.arc(this.sprite.x, this.sprite.y, this.tamanho, 0, Math.PI * 2);
        ctx.fill();
      }
    }
}

class ArrastavelHtml {
    constructor(id, tamanhoGrade, coord=true) {
        this.id = id;
        this.elemento = document.getElementById(id);
        this.coord = coord;
        this.seMove = 2;
        if(this.coord==true) {
          this.x = document.createElement('h1');
          this.x.id = 'posX';
          document.body.appendChild(this.x);
          this.y = document.createElement('h1');
          this.y.id = 'posY';
          document.body.appendChild(this.y);
          this.x.style.position = 'absolute';
          this.y.style.position = 'absolute';
          this.x.style.transform = 'translate(100px, 100px)';
          this.y.style.transform = 'translate(200px, 100px)';
        }
        this.tamanhoGrade = tamanhoGrade;
        this.arrastando = false;
        this.elemento.style.position = 'absolute';
        this.elemento.addEventListener('touchstart', (evento) => this.iniciarArrasto(evento));
        document.addEventListener('touchend', () => this.arrastando = false);
        document.addEventListener('touchmove', (evento) => this.arrastar(evento));
    }
    
    iniciarArrasto(evento) {
        const toque = evento.touches[0];
        this.posX = this.posX || this.elemento.offsetLeft;
        this.posY = this.posY || this.elemento.offsetTop;
        this.deslocX = toque.clientX - this.posX
        if(this.seMove==1 || this.seMove==2) this.deslocY = toque.clientY - this.posY
        this.arrastando = true;
    }

    arrastar(evento) {
        if(this.arrastando) {
            const toque = evento.touches[0];
            this.posX = toque.clientX - this.deslocX;
            this.posY = toque.clientY - this.deslocY;
            this.posX = Math.round(this.posX / this.tamanhoGrade) * this.tamanhoGrade;
            this.posY = Math.round(this.posY / this.tamanhoGrade) * this.tamanhoGrade;

            if(this.seMove==1 || this.seMove==3) this.elemento.style.left = this.posX+"px";
            if(this.seMove==2 || this.seMove==3) this.elemento.style.top = this.posY+"px";
            if(this.coord==true) {
              this.x.textContent = "X: " + this.posX;
              this.y.textContent = "Y: " + this.posY;
            }
        }
    }
}

class Camera {
  constructor(engine, foco, camada) {
    this.engine = engine;
    this.camada = camada;
    this.foco = foco;
  }
  
  att() {
    const ultimoX = this.foco.x - (this.engine.canvas.width / 2 - this.foco.escalaX / 2);
    const ultimoY = this.foco.y - (this.engine.canvas.height / 2 - this.foco.escalaY / 2);
    
    for(let i=0; i<this.camada.length; i++) {
      this.camada[i].x = this.camada[i].x - ultimoX;
      this.camada[i].y = this.camada[i].y - ultimoY;
    }
  }
}

class EditorMapas {
    constructor(tilesImgId="tiles", canvasId="telaJogo") {
        if(canvasId instanceof Engine) this.engine = canvasId
        else this.engine = new Engine(canvasId, false);
        this.modo = "desenhar";
        this.camadaAtual = 0;
        this.tileSelecionado = { x: 0, y: 0 };
        this.tamanhoTile = 16;
        this.mapaTiles = [];
        if(tilesImgId instanceof Image) this.tilesetImg = tilesImgId;
        else this.tilesetImg = document.getElementById("tiles");
        this.tilesetCanvas = document.createElement("canvas");
        this.tilesetCtx = this.tilesetCanvas.getContext("2d");
        this.ativo = true;
        
        this.iniciarTileset();
        this.iniciarMapa(40, 30);
      }
      
      iniciarTileset() {
        if(!this.tilesetImg) return;
        this.tilesetImg.onload = () => {
          this.tilesetCanvas.width = this.tilesetImg.naturalWidth || this.tilesetImg.width;
          this.tilesetCanvas.height = this.tilesetImg.naturalHeight || this.tilesetImg.height;
          this.tilesetCtx.clearRect(0,0,this.tilesetCanvas.width,this.tilesetCanvas.height);
          this.tilesetCtx.drawImage(this.tilesetImg, 0, 0);
        };
        if(this.tilesetImg.complete && this.tilesetImg.naturalWidth) {
          this.tilesetImg.onload();
        }
      }
      
      iniciarMapa(largura, altura) {
        for(let i = 0; i < this.engine.camadas.length; i++) {
          this.mapaTiles[i] = Array.from({ length: altura }, () => 
            Array.from({ length: largura }, () => null));
        }
      }
      
      selecionarTile(e) {
        const rect = this.tilesetImg.getBoundingClientRect();
        const escalaX = this.tilesetImg.naturalWidth / rect.width;
        const escalaY = this.tilesetImg.naturalHeight / rect.height;
        const px = (e.touches[0].clientX - rect.left) * escalaX;
        const py = (e.touches[0].clientY - rect.top) * escalaY;
        
        const x = Math.floor(px / this.tamanhoTile);
        const y = Math.floor(py / this.tamanhoTile);
        this.tileSelecionado = { x, y };
      }
      
      addTile(e) {
        if(this.modo != "desenhar" || !this.ativo) return;
        
        const coords = this.engine.obterCoordGlobal(e);
        const x = Math.floor(coords.x / this.tamanhoTile);
        const y = Math.floor(coords.y / this.tamanhoTile);
        
        if(x < 0 || y < 0 || x >= this.mapaTiles[0][0].length || y >= this.mapaTiles[0].length) return;
        
        const tileExistente = this.mapaTiles[this.camadaAtual][y][x];
        if(tileExistente) this.engine.rm(tileExistente, this.engine.camadas[this.camadaAtual]);
        
        const novoTile = this.engine.novoSprite(
          this.tilesetImg.src,
          this.engine.camadas[this.camadaAtual]);
        novoTile.x = x * this.tamanhoTile;
        novoTile.y = y * this.tamanhoTile;
        novoTile.escalaX = this.tamanhoTile;
        novoTile.escalaY = this.tamanhoTile;
        
        novoTile.imagem = this.tilesetImg;
        novoTile.sx = this.tileSelecionado.x * this.tamanhoTile;
        novoTile.sy = this.tileSelecionado.y * this.tamanhoTile;
        novoTile.sEX = this.tamanhoTile;
        novoTile.sEY = this.tamanhoTile;
        
        this.mapaTiles[this.camadaAtual][y][x] = novoTile;
        
        this.engine.renderizar();
      }
      
      rmTile(e) {
        if(this.modo != "apagar" || !this.ativo) return;
        
        const coords = this.engine.obterCoordGlobal(e);
        const x = Math.floor(coords.x / this.tamanhoTile);
        const y = Math.floor(coords.y / this.tamanhoTile);
        
        if(x < 0 || y < 0 || x >= this.mapaTiles[0][0].length || y >= this.mapaTiles[0].length) return;

        const tile = this.mapaTiles[this.camadaAtual][y][x];
        if(tile) {
          this.engine.rm(tile, this.engine.camadas[this.camadaAtual]);
          this.mapaTiles[this.camadaAtual][y][x] = null;
        }
        this.engine.renderizar();
      }
      
      novaCamada() {
        const camada = this.engine.novaCamada();
        const altura = this.mapaTiles[0].length;
        const largura = this.mapaTiles[0][0].length;
        this.mapaTiles.push(Array.from({ length: altura }, () => 
          Array.from({ length: largura }, () => null)
        ));
        this.attListaCamadas();
        return camada;
      }
      
      rmCamada() {
        if(this.engine.camadas.length <= 1) {
          alert("Não é possível remover a última camada.");
          return;
        }
        const camada = this.engine.camadas[this.camadaAtual];
        while(camada.length > 0) this.engine.rm(camada[0], camada);
        
        this.engine.camadas.splice(this.camadaAtual, 1);
        this.mapaTiles.splice(this.camadaAtual, 1);
        
        if(this.camadaAtual >= this.engine.camadas.length) this.camadaAtual = this.engine.camadas.length - 1;
        
        this.attListaCamadas();
        this.engine.renderizar();
      }
      
      selecionarCamada(indice) {
        this.camadaAtual = indice;
        this.attListaCamadas();
      }
      
      attListaCamadas() {
        const lista = document.getElementById("listaCamadas");
        lista.innerHTML = "";
        
        for(let i = 0; i < this.engine.camadas.length; i++) {
          const btn = document.createElement("button");
          btn.textContent = `Camada ${i} ${i === this.camadaAtual ? "(Ativa)" : ""}`;
          btn.addEventListener("click", () => this.selecionarCamada(i));
          lista.appendChild(btn);
        }
      }
      
      salvarMapa() {
        const dadosMapa = {
          tileset: this.tilesetImg.src,
          tamanhoTile: this.tamanhoTile,
          camadas: []
        };
        for(let c = 0; c < this.mapaTiles.length; c++) {
          const camada = [];
          for(let y = 0; y < this.mapaTiles[c].length; y++) {
            const linha = [];
            for(let x = 0; x < this.mapaTiles[c][y].length; x++) {
              const tile = this.mapaTiles[c][y][x];
              if(tile) {
                linha.push({
                  sx: tile.sx, sy: tile.sy,
                  sEX: tile.sEX, sEY: tile.sEY
                });
              } else linha.push(null);
            }
            camada.push(linha);
          }
          dadosMapa.camadas.push(camada);
        }
        return dadosMapa;
      }
      
      carregarMapa(jsonStr, tileset=this.tilesetImg) {
        try {
          if(!jsonStr) {
            alert("Nenhum JSON fornecido.");
            return;
          }
          const dadosMapa = JSON.parse(jsonStr);
          this.engine.limpar();
          this.mapaTiles = [];
          tileset.src = dadosMapa.tileset;
          this.tamanhoTile = dadosMapa.tamanhoTile || 16;
          
          for(let c = 0; c < dadosMapa.camadas.length; c++) {
            const camadaDados = dadosMapa.camadas[c];
            const camada = c === 0 ? this.engine.camada : this.engine.novaCamada();
            
            this.mapaTiles[c] = Array.from({ length: camadaDados.length }, () => 
              Array.from({ length: camadaDados[0].length }, () => null)
            );
            for(let y = 0; y < camadaDados.length; y++) {
              for(let x = 0; x < camadaDados[y].length; x++) {
                const tileDados = camadaDados[y][x];
                if(tileDados) {
                  const tile = this.engine.novoSprite(tileset.src, camada);
                  tile.x = x * this.tamanhoTile;
                  tile.y = y * this.tamanhoTile;
                  tile.escalaX = this.tamanhoTile;
                  tile.escalaY = this.tamanhoTile;
                  tile.imagem = tileset;
                  tile.sx = tileDados.sx;
                  tile.sy = tileDados.sy;
                  tile.sEX = tileDados.sEX;
                  tile.sEY = tileDados.sEY;
                  this.mapaTiles[c][y][x] = tile;
                }
              }
            }
          }
          this.camadaAtual = 0;
          this.engine.renderizar();
        } catch(e) {
          console.error("Erro ao carregar mapa: " + e.message);
          alert("Erro ao carregar mapa: " + e.message);
        }
      }
}

class Zoom {
    constructor(canvasId, escala=1) {
        this.canvas = document.getElementById(canvasId);
        if(this.canvas) {
            this.ctx;
            this.escala = escala;
            this.escalaMin = 0.5;
            this.escalaMax = 3;
            this.panX = 0;
            this.panY = 0;
            this.arrastando = false;
            this.ultimoToqueX = 0;
            this.ultimoToqueY = 0;
            this.distAnterior = 0;
            this.ativo = true;
            
            this.canvas.addEventListener('touchstart', (e) => { if(this.ativo) this.aoIniciar(e); });
            this.canvas.addEventListener('touchmove', (e) => { if(this.ativo) this.aoMover(e); });
            this.canvas.addEventListener('touchend', () => { if(this.ativo) this.noFim(); });
            this.canvas.addEventListener('touchcancel', () => { if(this.ativo) this.noFim(); });
        }
    }

    aplicarTransformacao() {
        if(!this.ctx) return;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.escala, this.escala);
    }

    aoIniciar(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        if(e.touches.length === 1) {
            this.arrastando = true;
            this.ultimoToqueX = e.touches[0].clientX - rect.left;
            this.ultimoToqueY = e.touches[0].clientY - rect.top;
        } else if(e.touches.length === 2) {
            this.arrastando = false;
            const toque1 = e.touches[0];
            const toque2 = e.touches[1];
            
            const toque1X = toque1.clientX - rect.left;
            const toque1Y = toque1.clientY - rect.top;
            const toque2X = toque2.clientX - rect.left;
            const toque2Y = toque2.clientY - rect.top;
            
            this.distAnterior = Math.hypot(toque2X - toque1X, toque2Y - toque1Y);
            this.pontoCentralX = (toque1X + toque2X) / 2;
            this.pontoCentralY = (toque1Y + toque2Y) / 2;
        }
    }

    aoMover(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        if(this.arrastando && e.touches.length === 1) {
            const toqueX = e.touches[0].clientX - rect.left;
            const toqueY = e.touches[0].clientY - rect.top;
            
            this.panX += toqueX - this.ultimoToqueX;
            this.panY += toqueY - this.ultimoToqueY;
            
            this.ultimoToqueX = toqueX;
            this.ultimoToqueY = toqueY;
        } else if(e.touches.length === 2) {
            const toque1 = e.touches[0];
            const toque2 = e.touches[1];
            
            const toque1X = toque1.clientX - rect.left;
            const toque1Y = toque1.clientY - rect.top;
            const toque2X = toque2.clientX - rect.left;
            const toque2Y = toque2.clientY - rect.top;
            
            const distAtual = Math.hypot(toque2X - toque1X, toque2Y - toque1Y);
            
            if(this.distAnterior > 0) {
                const fatorZoom = distAtual / this.distAnterior;
                const novaEscala = this.escala * fatorZoom;

                if(novaEscala >= this.escalaMin && novaEscala <= this.escalaMax) {
                    this.panX -= this.pontoCentralX;
                    this.panY -= this.pontoCentralY;
                    
                    this.panX *= fatorZoom;
                    this.panY *= fatorZoom;

                    this.panX += this.pontoCentralX;
                    this.panY += this.pontoCentralY;

                    this.escala = novaEscala;
                }
            }
            this.distAnterior = distAtual;
        }
    }

    noFim() {
        this.arrastando = false;
        this.distAnterior = 0;
    }
}