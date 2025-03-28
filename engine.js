class Engine {
  constructor(canvasId, renderAutomatico=true, canvasCompleto=true) {
    if(canvasId) {
      this.canvas = document.getElementById(canvasId);
    } else {
      this.canvas = document.querySelector("canvas");
    }
    
    this.ctx = this.canvas.getContext("2d");
    this.ctx
    this.texto = [];
    this.camadas = [];
    this.camada1 = this.novaCamada();
    this.renderizacao = renderAutomatico;
    
    if(this.renderizacao) this.renderizar();
    if(canvasCompleto) this.ajustarTela();
  }
  
  novaCamada(renderizarAutomatico=true) {
    const camada = [];
    if(renderizarAutomatico) this.camadas.push(camada);
    return camada;
  }
  
  novaParticula(sprite, camada) {
    const particula = new Particula(null, sprite);
    if(!camada) {
      camada.push(particula);
    } else {
      this.camada1.push(particula);
    }
  }
  
  novoSprite(png, camada, x=0, y=0, escalaX=32, escalaY=32, auto=true) {
    const sprite = {
      imagem: new Image(),
      x: 0,
      y: 0,
      escalaX: 16,
      escalaY: 16
    };
    
    sprite.imagem.src = png;
    sprite.x=x;
    sprite.y=y;
    sprite.escalaX=escalaX;
    sprite.escalaY=escalaY;
    if(auto==true) {
      if(!camada) {
        camada.push(sprite);
      } else {
        this.camada1.push(sprite);
      }
    }
    return sprite;
  }
  
  comecarAnimacao(alvo, animacao, intervalo=0.5, inicio=0) {
    let frame = inicio;
    setTimeout(() => {
      alvo.imagem.src = animacao[frame];
      frame += 1;
      
      if(frame<animacao.length) requestAnimationFrame(() => this.comecarAnimacao(alvo, animacao, intervalo, frame));
    }, intervalo * 1000);
  }
  
  renderizar(canvasOculto) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for(const camada of this.camadas) {
      for(const sprite of camada) {
        if(sprite.imagem && sprite.imagem.complete) {
          this.ctx.drawImage(
            sprite.imagem,
            sprite.x, sprite.y,
            sprite.escalaX, sprite.escalaY
          );
        } else if(sprite.texto) {
          this.ctx.fillText(
            sprite.texto,
            sprite.x, sprite.y,
            sprite.escalaX, sprite.escalaY
          );
          this.ctx.font = sprite.escala;
          this.ctx.fillStyle = sprite.cor;
        } else if(sprite instanceof Particula) {
          sprite.desenhar(this.ctx);
          sprite.atualizar(this.canvas.width, this.canvas.height);
        }
      }
    }
    
    if(canvasOculto) {
      this.ctx.drawImage(canvasOculto, 0, 0);
    }
    if(this.renderizacao) {
      requestAnimationFrame(() => this.renderizar(canvasOculto), this.canvas);
    }
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
  
  solido(sprite1, sprite2){
		let somaEscalaX = sprite1.escalaX/2 + sprite2.escalaX/2;
		let somaEscalaY = sprite1.escalaY/2 + sprite2.escalaY/2;
		let metadeX1 = sprite1.escalaX/2;
		let metadeX2 = sprite2.escalaX/2;
		let metadeY1 = sprite1.escalaY/2;
		let metadeY2 = sprite2.escalaY/2;
		
		let centroX1 = sprite1.x + metadeX1;
		let centroX2 = sprite2.x + metadeX2;
		let centroY1 = sprite1.y + metadeY1;
		let centroY2 = sprite2.y + metadeY2;
		
		let distanciaX = centroX1 - centroX2;
		let distanciaY = centroY1 - centroY2;
		
		if(Math.abs(distanciaX) < somaEscalaX && Math.abs(distanciaY) < somaEscalaY){
		  let antesX = somaEscalaX - Math.abs(distanciaX);
		  let antesY = somaEscalaY - Math.abs(distanciaY);
		  
		  if(antesX >= antesY){
		    if(distanciaY > 0){
		      sprite1.y += antesY;
		    } else {
		      sprite1.y -= antesY;
		    }
		  } else {
		    if(distanciaY > 0){
		      sprite1.x += antesX;
		    } else {
		      sprite1.x -= antesX;
		    }
		  }
		}
  }
  
  novoMapa(json, tiles, x=0, y=0, escala=16, camada) {
  const solidos = [];

  function verificacao(tile, item, listaSolidos) {
    if(listaSolidos.includes(tile)) {
      solidos.push(item);
    }
  }

  for(let linha = 0; linha < json.mapa.length; linha++) {
    for(let coluna = 0; coluna < json.mapa[linha].length; coluna++) {
      const tipoTile = json.mapa[linha][coluna];

      if(tipoTile !== "ar") {
        const tile = tiles[tipoTile];
        const novoTile = this.novoSprite(tile, camada);
        novoTile.x = x + coluna * escala;
        novoTile.y = y + linha * escala;
        novoTile.escalaX = escala;
        novoTile.escalaY = escala;

        verificacao(tipoTile, novoTile, json.colisao);
      }
    }
  }
  return solidos;
}
  
  novoTexto(escrita, tamanho="30px", coloracao="blue", camada) {
    const texto = {
      texto: escrita,
      cor: coloracao,
      x: 100,
      y: 100,
      escala: tamanho+" Ariel",
      escalaX: 228,
      escalaY: 32
    };
    if(!camada) {
      this.camada1.push(texto);
    } else {
      camada.push(texto);
    }
  }
  
  novoBotao(png, estado="click", funcao, camada, x=0, y=0, escalaX=16, escalaY=16) {
    const sprite = {
      imagem: new Image(),
      x: 0,
      y: 0,
      escalaX: 16,
      escalaY: 16
    };
    sprite.imagem.src=png;
    sprite.x=x;
    sprite.y=y;
    sprite.escalaX=escalaX;
    sprite.escalaY=escalaY;
    
    if(estado==="click") {
      sprite.imagem.onload = () => {
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
              funcao(evento);
            }
        });
      }
    } else if(estado==="loop") {
      let pressionado = false;
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
            
            loop(funcao);
            
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
      
      this.canvas.addEventListener('touchend', (evento) => {
        pressionado = false;
      });
    }
    
    if(!camada) {
      this.camada1.push(sprite);
    } else {
      camada.push(sprite);
    }

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
  
  mudarTela(tela) {
    window.location.href = tela;
  }
}

class Sprite {
  constructor(caminho, x=0, y=0, escalaX=32, escalaY=32) {
    this.imagem = new Image();
    this.imagem.src = caminho;
    this.x = x;
    this.y = y;
    this.escalaX = escalaX;
    this.escalaY = escalaY;
  }
}

class Particula {
    constructor(cor, caminho, velocidadeX=100, velocidadeY=100, vida=200) {
        this.cor = cor;
        this.sprite = new Sprite(caminho);
        this.velocidadeX = velocidadeX;
        this.velocidadeY = velocidadeY;
        this.vida = vida;
        this.tamanho = Math.random() * 5 + 2;
    }

    atualizar(larguraCanvas, alturaCanvas) {
      this.comportamento();
        this.vida -= 1;

        if(this.sprite.x < 0 || this.sprite.x > larguraCanvas || this.sprite.y < 0 || this.sprite.y > alturaCanvas || this.vida <= 0) {
            return false;
        }
        return true;
    }
    
    comportamento() {
      this.sprite.x += Math.random()*5;
      this.sprite.y += Math.random()*5;
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
    constructor(id, tamanhoGrade) {
        this.id = id;
        this.elemento = document.getElementById(id);
        
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
        
        this.tamanhoGrade = tamanhoGrade;
        this.arrastando = false;
        
        this.elemento.style.position = 'absolute';
        
        this.elemento.addEventListener('touchstart', (evento) => this.iniciarArrasto(evento));
        document.addEventListener('touchend', () => this.arrastando = false);
        document.addEventListener('touchmove', (evento) => this.arrastar(evento));
    }
    
    iniciarArrasto(evento) {
        evento.preventDefault();
        
        const toque = evento.touches[0];
        
        this.posX = this.posX || this.elemento.offsetLeft;
        this.posY = this.posY || this.elemento.offsetTop;
        
        this.deslocX = toque.clientX - this.posX
        this.deslocY = toque.clientY - this.posY
        
        this.arrastando = true;
    }

    arrastar(evento) {
        if(this.arrastando) {
            const toque = evento.touches[0];
            
            this.posX = toque.clientX - this.deslocX;
            this.posY = toque.clientY - this.deslocY;
            
            this.posX = Math.round(this.posX / this.tamanhoGrade) * this.tamanhoGrade;
            this.posY = Math.round(this.posY / this.tamanhoGrade) * this.tamanhoGrade;
            
            this.elemento.style.transform = `translate(${this.posX}px, ${this.posY}px)`;
            
            this.x.textContent = "X: " + this.posX;
            this.y.textContent = "Y: " + this.posY;
        }
    }
}