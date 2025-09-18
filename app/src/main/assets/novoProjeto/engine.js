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
    
    if(this.renderizacao) this.renderizar();
    if(canvasCompleto) this.ajustarTela();
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
        if(frame<animacao.length) {
          requestAnimationFrame(() => this.rodarAnimacao(alvo, animacao, repetir, intervalo, frame));
        }
    }, intervalo * 1000);
  }
  
  renderizar(canvasOculto) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if(this.camera) this.camera.att();
    for(const camada of this.camadas) {
      for(const sprite of camada) {
        try {
          // spriteheet, heet? a foda-se, alguma coisa assim
          if(sprite.sx != null) {
              this.ctx.drawImage(
                sprite.imagem,
                sprite.sx, sprite.sy, sprite.sEX, sprite.sEY,
                sprite.x, sprite.y, sprite.escalaX, sprite.escalaY
              );
              // sprite completa:
            } else if(sprite.imagem != null && sprite.imagem.complete) {
              this.ctx.drawImage(
                sprite.imagem,
                sprite.x, sprite.y,
                sprite.escalaX, sprite.escalaY
            );
            // objeto sem imagem:
            } else if(sprite.cor != null && sprite.texto == null) {
              this.ctx.fillStyle = sprite.cor;
              this.ctx.fillRect(
                sprite.x, sprite.y,
                sprite.escalaX, sprite.escalaY
              );
              // texto:
            } else if(sprite.texto) {
              if(sprite.texto.includes("\n")) {
                const array = sprite.texto.split("\n");
                for(let i = 0; i < array.length; i++) {
                  this.ctx.fillStyle = sprite.cor;
                  this.ctx.font = sprite.escala;
                  this.ctx.fillText(
                    array[i],
                    sprite.x, sprite.y+i*parseInt(sprite.escala, 10),
                    sprite.escalaX, sprite.escalaY
                  );
                }
              } else {
                this.ctx.fillStyle = sprite.cor;
                this.ctx.font = sprite.escala;
                this.ctx.fillText(
                  sprite.texto,
                  sprite.x, sprite.y,
                  sprite.escalaX, sprite.escalaY
                );
              }
            } else if(sprite instanceof Particula) {
              sprite.desenhar(this.ctx);
              sprite.atualizar(this.canvas.width, this.canvas.height);
            }
        } catch(err) {
          if(err instanceof DOMException) {
            alert("Erro DOMException ao desenhar sprite (ver console).");
            console.error("DOMException ao desenhar sprite:", sprite, err);
            throw err;
          } else throw err;
        }
      }
    }
    if(canvasOculto) this.ctx.drawImage(canvasOculto, 0, 0);
    if(this.renderizacao) requestAnimationFrame(() => this.renderizar(canvasOculto), this.canvas);
  }
  
  renderizacaoOculta(mapa) {
    const canvasOculto = document.createElement("canvas");
    const contextoOculto = canvasOculto.getContext("2d");
    
    if(mapa) {
      for(const tile of mapa) {
        contextoOculto.drawImage(
          tile.imagem,
          tile.x, tile.y,
          tile.escalaX, tile.escalaY
        );
      }
    } else {
      for(const camada of this.camadas) {
        for(const sprite of camada) {
          contextoOculto.drawImage(
            sprite.imagem, 
            sprite.x, sprite.y,
            sprite.escalaX, sprite.escalaY
          );
        }
      }
    }
    return canvasOculto;
  }
  
  solido(s1, s2, elasticidade = 0.8, atrito = 0.3) {
    if(s1.x + s1.escalaX <= s2.x || 
        s1.x >= s2.x + s2.escalaX || 
        s1.y + s1.escalaY <= s2.y || 
        s1.y >= s2.y + s2.escalaY) {
        return false;
    }
    // calcula sobreposição real
    const sobreX = Math.min(s1.x + s1.escalaX, s2.x + s2.escalaX) - Math.max(s1.x, s2.x);
    const sobreY = Math.min(s1.y + s1.escalaY, s2.y + s2.escalaY) - Math.max(s1.y, s2.y);
    // resolve no eixo de menor sobreposição
    if(sobreX < sobreY) {
        // colisão horizontal
        if(s1.x < s2.x) s1.x = s2.x - s1.escalaX;
        else s1.x = s2.x + s2.escalaX;
        s1.vx = -s1.vx * elasticidade;
    } else {
        // colisão vertical
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
        const toqueX = evento.touches[0].clientX - this.canvas.getBoundingClientRect().left;
        const toqueY = evento.touches[0].clientY - this.canvas.getBoundingClientRect().top;
        
        if(
          toqueX >= sprite.x &&
          toqueX <= sprite.x + sprite.escalaX &&
          toqueY >= sprite.y &&
          toqueY <= sprite.y + sprite.escalaY) {
            sprite.click(evento);
          }
      });
    }
    if(sprite.pressionado) {
      this.canvas.addEventListener('touchstart', (evento) => {
        evento.preventDefault();
        
        const toqueX = evento.touches[0].clientX - this.canvas.getBoundingClientRect().left;
        const toqueY = evento.touches[0].clientY - this.canvas.getBoundingClientRect().top;
        
        if(
          toqueX >= sprite.x &&
          toqueX <= sprite.x + sprite.escalaX &&
          toqueY >= sprite.y &&
          toqueY <= sprite.y + sprite.escalaY
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
          this.sprite.imagem,
          this.sprite.x,
          this.sprite.y,
          this.sprite.escalaX,
          this.sprite.escalaY
          )
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