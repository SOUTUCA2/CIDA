const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const path = require('path');
const axios = require('axios');

const app = express();
const porta = 3000;

// Habilitar CORS para permitir requisições do navegador
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Servir arquivos estáticos da pasta atual 
app.use(express.static(__dirname));

let dadosSensores = {
  temperatura: 'Dados não disponíveis',
  umidade: 'Dados não disponíveis',
  pressao: 'Dados não disponíveis'
};

let modoDesenvolvimento = true; // Mude para true se não tiver Arduino conectado

// Função para gerar dados simulados do BME280
function gerarDadosSimulados() {
  setInterval(() => {
    dadosSensores.temperatura = (Math.random() * 10 + 20).toFixed(2);
    dadosSensores.umidade = (Math.random() * 20 + 40).toFixed(2);
    dadosSensores.pressao = (Math.random() * 100 + 950).toFixed(2); // Pressão entre 950-1050 hPa
    console.log('Dados simulados do BME280 gerados:', dadosSensores);
  }, 2000);
}

// Modo desenvolvimento: Gera dados de sensores simulados
if (modoDesenvolvimento) {
  console.log('Executando em modo desenvolvimento - gerando dados simulados do BME280');
  gerarDadosSimulados();
} else {
  // Modo produção: Conecta ao Arduino real
  const portaArduino = 'COM8'; // <<-- VERIFIQUE E ALTERE ESTA PORTA -->>
  
  try {
    const portaSerial = new SerialPort({
      path: portaArduino,
      baudRate: 9600,
    });

    const parser = portaSerial.pipe(new ReadlineParser({ delimiter: '\n' }));

    portaSerial.on('open', () => {
      console.log('Porta serial aberta:', portaArduino);
    });

    parser.on('data', (dados) => {
      console.log('Dados recebidos do BME280:', dados);
      const dadosStr = dados.toString().trim();

      // Tentar extrair temperatura, umidade e pressão usando regex para formatos variados
      const tempMatch = dadosStr.match(/temperatura[:\s]*([\d.]+)/i);
      const humMatch = dadosStr.match(/umidade[:\s]*([\d.]+)/i);
      const pressMatch = dadosStr.match(/press(?:ao|ure)?[:\s]*([\d.]+)/i);

      if (tempMatch && humMatch && pressMatch) {
        const temp = parseFloat(tempMatch[1]);
        const hum = parseFloat(humMatch[1]);
        const press = parseFloat(pressMatch[1]);
        if (!isNaN(temp) && !isNaN(hum) && !isNaN(press)) {
          dadosSensores.temperatura = temp.toFixed(2);
          dadosSensores.umidade = hum.toFixed(2);
          dadosSensores.pressao = press.toFixed(2);
          console.log('Dados atualizados:', dadosSensores);
        } else {
          console.log('Dados inválidos recebidos:', dadosStr);
        }
      } else {
        // Tentar formato em inglês: "Humidity: 54.00%  Temperature: 23.90°C  Pressure: 1013.25 hPa"
        const humMatchEn = dadosStr.match(/Humidity:\s*([\d.]+)%/i);
        const tempMatchEn = dadosStr.match(/Temperature:\s*([\d.]+)°C/i);
        const pressMatchEn = dadosStr.match(/Pressure:\s*([\d.]+)\s*hPa/i);

        if (humMatchEn && tempMatchEn && pressMatchEn) {
          const hum = parseFloat(humMatchEn[1]);
          const temp = parseFloat(tempMatchEn[1]);
          const press = parseFloat(pressMatchEn[1]);
          if (!isNaN(temp) && !isNaN(hum) && !isNaN(press)) {
            dadosSensores.temperatura = temp.toFixed(2);
            dadosSensores.umidade = hum.toFixed(2);
            dadosSensores.pressao = press.toFixed(2);
            console.log('Dados atualizados (inglês):', dadosSensores);
          } else {
            console.log('Dados inválidos recebidos:', dadosStr);
          }
        } else {
          // Tentar formato "Temp: 23.5 Hum: 45.6 Press: 1013.2"
          const tempMatch2 = dadosStr.match(/Temp:\s*([\d.]+)/i);
          const humMatch2 = dadosStr.match(/Hum:\s*([\d.]+)/i);
          const pressMatch2 = dadosStr.match(/Press:\s*([\d.]+)/i);

          if (tempMatch2 && humMatch2 && pressMatch2) {
            const temp = parseFloat(tempMatch2[1]);
            const hum = parseFloat(humMatch2[1]);
            const press = parseFloat(pressMatch2[1]);
            if (!isNaN(temp) && !isNaN(hum) && !isNaN(press)) {
              dadosSensores.temperatura = temp.toFixed(2);
              dadosSensores.umidade = hum.toFixed(2);
              dadosSensores.pressao = press.toFixed(2);
              console.log('Dados atualizados (Temp/Hum/Press):', dadosSensores);
            } else {
              console.log('Dados inválidos recebidos:', dadosStr);
            }
          } else {
            // Fallback para formato simples "temp,hum,press"
            const dadosArray = dadosStr.split(',');
            if (dadosArray.length === 3) {
              const temp = parseFloat(dadosArray[0].trim());
              const hum = parseFloat(dadosArray[1].trim());
              const press = parseFloat(dadosArray[2].trim());
              if (!isNaN(temp) && !isNaN(hum) && !isNaN(press)) {
                dadosSensores.temperatura = temp.toFixed(2);
                dadosSensores.umidade = hum.toFixed(2);
                dadosSensores.pressao = press.toFixed(2);
                console.log('Dados atualizados (fallback):', dadosSensores);
              }
            } else {
              console.log('Formato de dados não reconhecido:', dadosStr);
            }
          }
        }
      }
    });

    portaSerial.on('error', (erro) => {
      console.error('Erro na porta serial:', erro.message);
    });
  } catch (erro) {
    console.error('Falha ao inicializar porta serial:', erro.message);
    console.log('Retornando para modo desenvolvimento');
    modoDesenvolvimento = true;
    gerarDadosSimulados();
  }
}

// Servir a página HTML quando acessar a raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint para obter todos os dados dos sensores
app.get('/api/sensors', (req, res) => {
  if (dadosSensores.temperatura !== 'Dados não disponíveis') {
    res.json(dadosSensores);
  } else {
    res.status(503).json({ erro: 'Dados de sensores não disponíveis ainda' });
  }
});

// Endpoint para obter previsão do tempo (usando Open-Meteo - API gratuita)
app.get('/api/forecast', async (req, res) => {
  try {
    const cidade = req.query.cidade || 'São Paulo'; // Cidade padrão: São Paulo

    // Primeiro, obter coordenadas da cidade usando geocoding
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&format=json`;
    const geoResponse = await axios.get(geoUrl);
    const geoData = geoResponse.data;

    if (!geoData.results || geoData.results.length === 0) {
      return res.status(404).json({ erro: 'Cidade não encontrada' });
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    // Buscar previsão do tempo usando as coordenadas
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=America/Sao_Paulo&forecast_days=5`;
    const weatherResponse = await axios.get(weatherUrl);
    const weatherData = weatherResponse.data;

    // Mapeamento de códigos de tempo para descrições em português
    const weatherDescriptions = {
      0: 'Céu limpo',
      1: 'Principalmente limpo',
      2: 'Parcialmente nublado',
      3: 'Nublado',
      45: 'Névoa',
      48: 'Névoa com geada',
      51: 'Garoa leve',
      53: 'Garoa moderada',
      55: 'Garoa intensa',
      56: 'Garoa congelante leve',
      57: 'Garoa congelante intensa',
      61: 'Chuva leve',
      63: 'Chuva moderada',
      65: 'Chuva forte',
      66: 'Chuva congelante leve',
      67: 'Chuva congelante forte',
      71: 'Neve leve',
      73: 'Neve moderada',
      75: 'Neve forte',
      77: 'Grãos de neve',
      80: 'Chuva leve',
      81: 'Chuva moderada',
      82: 'Chuva forte',
      85: 'Neve leve',
      86: 'Neve forte',
      95: 'Tempestade',
      96: 'Tempestade com granizo leve',
      99: 'Tempestade com granizo forte'
    };

    // Extrair previsões para os próximos 5 dias
    const previsoes = weatherData.daily.time.map((date, index) => ({
      data: new Date(date).toLocaleDateString('pt-BR'),
      temperatura_min: weatherData.daily.temperature_2m_min[index].toFixed(1),
      temperatura_max: weatherData.daily.temperature_2m_max[index].toFixed(1),
      descricao: weatherDescriptions[weatherData.daily.weathercode[index]] || 'Desconhecido',
      icone: getWeatherIcon(weatherData.daily.weathercode[index])
    }));

    res.json({
      cidade: name,
      pais: country,
      previsoes: previsoes
    });
  } catch (error) {
    console.error('Erro ao buscar previsão:', error.message);
    res.status(500).json({ erro: 'Erro ao buscar previsão do tempo' });
  }
});

// Função auxiliar para obter ícones do tempo (compatível com OpenWeatherMap)
function getWeatherIcon(weathercode) {
  const iconMap = {
    0: '01d', // Céu limpo
    1: '02d', // Principalmente limpo
    2: '03d', // Parcialmente nublado
    3: '04d', // Nublado
    45: '50d', // Névoa
    48: '50d', // Névoa com geada
    51: '09d', // Garoa leve
    53: '09d', // Garoa moderada
    55: '09d', // Garoa intensa
    61: '10d', // Chuva leve
    63: '10d', // Chuva moderada
    65: '10d', // Chuva forte
    71: '13d', // Neve leve
    73: '13d', // Neve moderada
    75: '13d', // Neve forte
    80: '09d', // Pancadas de chuva leves
    81: '09d', // Pancadas de chuva moderadas
    82: '09d', // Pancadas de chuva fortes
    85: '13d', // Pancadas de neve leves
    86: '13d', // Pancadas de neve fortes
    95: '11d', // Tempestade
    96: '11d', // Tempestade com granizo leve
    99: '11d'  // Tempestade com granizo forte
  };
  return iconMap[weathercode] || '01d';
}

app.listen(porta, () => {
  console.log(`Servidor API ouvindo em http://localhost:${porta}`);
}); 