class Engine {
  constructor(canvasId, renderAutomatico=true, canvasCompleto=true) {
    if(canvasId) {
      this.canvas = document.getElementById(canvasId);
    } else {
      this.canvas = document.querySelector("canvas");
    }
    
    this.contexto = this.canvas.getContext("2d");
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
  
  novoSprite(png, camada) {
    const sprite = [{
      imagem: new Image(),
      x: 0,
      y: 0,
      escalaX: 16,
      escalaY: 16
    }];
    
    sprite[0].imagem.src = png;

    if(!camada) {
      this.camada1.push(sprite[0]);
    } else {
      camada.push(sprite[0]);
    }
    return sprite[0];
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
    this.contexto.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for(const camada of this.camadas) {
      for(const elemento of camada) {
        if(elemento.imagem && elemento.imagem.complete) {
          this.contexto.drawImage(
            elemento.imagem,
            elemento.x, elemento.y,
            elemento.escalaX, elemento.escalaY
          );
        }
        if(elemento.texto) {
          this.contexto.fillText(
            elemento.texto,
            elemento.x, elemento.y,
            elemento.escalaX, elemento.escalaY
          );
          this.contexto.font = elemento.escala;
          this.contexto.fillStyle = elemento.cor;
        }
      }
    }
    
    if(canvasOculto) {
      this.contexto.drawImage(canvasOculto, 0, 0);
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
    const texto = [{
      texto: escrita,
      cor: coloracao,
      x: 100,
      y: 100,
      escala: tamanho+" Ariel",
      escalaX: 228,
      escalaY: 32
    }];
    if(!camada) {
      this.camada1.push(texto[0]);
    } else {
      camada.push(texto[0]);
    }
  }
  
  novoBotao(png, estado="click", funcao, camada) {
    const sprite = [{
      imagem: new Image(),
      x: 0,
      y: 0,
      escalaX: 16,
      escalaY: 16
    }];
    sprite[0].imagem.src = png;
    if(estado==="click") {
      sprite[0].imagem.onload = () => {
        this.canvas.addEventListener('touchstart', (evento) => {
          evento.preventDefault();
          
          const toqueX = evento.touches[0].clientX - this.canvas.getBoundingClientRect().left;
          const toqueY = evento.touches[0].clientY - this.canvas.getBoundingClientRect().top;
          
          if (
            toqueX >= sprite[0].x &&
            toqueX <= sprite[0].x + sprite[0].escalaX &&
            toqueY >= sprite[0].y &&
            toqueY <= sprite[0].y + sprite[0].escalaY
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
        
        if (
          toqueX >= sprite[0].x &&
          toqueX <= sprite[0].x + sprite[0].escalaX &&
          toqueY >= sprite[0].y &&
          toqueY <= sprite[0].y + sprite[0].escalaY
          ) {
            pressionado = true;
            
            loop(funcao);
            
            function loop(funcao) {
              setTimeout(() => {
                if (pressionado) {
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
      this.camada1.push(sprite[0]);
    } else {
      camada.push(sprite[0]);
    }

    return sprite[0];
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