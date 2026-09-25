# Arduino BMP280 Temperature Monitor

Sentinelas Urbanas

Este projeto exibe dados de temperatura de um sensor BMP280 conectado ao Arduino em uma interface web.

## Estrutura do Projeto

- `index.js` - API Node.js que se comunica com o Arduino via porta serial
- `index.html` - Interface web que exibe os dados de temperatura
- `bmp280-temperature.ino` - Código Arduino para o sensor BMP280

## Requisitos

1. Node.js instalado
2. Arduino com sensor BMP280 conectado
3. Biblioteca Adafruit BMP280 instalada no Arduino IDE

## Configuração

1. **Instalar dependências Node.js:**
   ```bash
   npm install
   ```

2. **Carregar código no Arduino:**
   - Abra `bmp280-temperature.ino` no Arduino IDE
   - Selecione a placa e porta corretas
   - Carregue o código no Arduino

3. **Configurar porta COM:**
   - Verifique a porta COM do seu Arduino no Arduino IDE (Ferramentas > Porta)
   - Atualize a porta COM em `index.js` se necessário (padrão é COM14)

## Execução

1. **Iniciar o servidor:**
   ```bash
   node index.js
   ```

2. **Acessar a interface web:**
   - Abra o navegador em `http://localhost:3000`

## Modo de Desenvolvimento

Para testar sem Arduino conectado:
1. Em `index.js`, mude `modoDesenvolvimento` para `true`
2. Inicie o servidor normalmente
3. O sistema gerará dados de temperatura simulados

## Funcionamento

- O Arduino lê a temperatura do sensor BMP280 a cada 2 segundos
- O servidor Node.js escuta a porta serial e atualiza o valor da temperatura
- A interface web atualiza automaticamente a cada 2 segundos
