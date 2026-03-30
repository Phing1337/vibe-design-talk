/**
 * weather.js — Weather Data, Visualization, Picker
 *
 * Handles: fetchWeather, applyWeather, generateParticles,
 * weather picker, timestamp clock, hourly/weekly forecast,
 * temp sparkline, sun arc, UV gauge, history chart.
 *
 * Exports to PRES: fetchWeather
 *
 * No dependencies on other PRES modules.
 */
(function() {
  'use strict';

  var liveWeatherData = null;
  var currentWeatherMode = 'live';

  var weatherIcons = {
    sunny: '☀️', cloudy: '☁️', rain: '🌧️', storm: '⛈️',
    partlyCloudy: '⛅', fog: '🌫️', snow: '🌨️'
  };

  function classifyWeather(desc) {
    var d = desc.toLowerCase();
    if (d.includes('thunder') || d.includes('storm')) return 'storm';
    if (d.includes('rain') || d.includes('drizzle') || d.includes('shower')) return 'rain';
    if (d.includes('cloud') || d.includes('overcast') || d.includes('mist') || d.includes('fog')) return 'cloudy';
    return 'sunny';
  }

  function getWeatherIcon(type) {
    return weatherIcons[type] || '🌡️';
  }

  function fetchWeather() {
    var controller = new AbortController();
    setTimeout(function() { controller.abort(); }, 5000);

    fetch('https://wttr.in/Seattle?format=j1', { signal: controller.signal })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var current = data.current_condition[0];
        liveWeatherData = {
          temp: Math.round(parseFloat(current.temp_F)),
          desc: current.weatherDesc[0].value,
          humidity: parseInt(current.humidity),
          wind: Math.round(parseFloat(current.windspeedMiles)),
          visibility: parseInt(current.visibility),
          pressure: parseInt(current.pressure),
          feelsLike: Math.round(parseFloat(current.FeelsLikeF)),
          uvIndex: parseInt(current.uvIndex),
          type: classifyWeather(current.weatherDesc[0].value),
        };
        if (currentWeatherMode === 'live') {
          applyWeather(liveWeatherData);
          refreshWeatherVisualizations();
        }
      })
      .catch(function() {
        liveWeatherData = {
          temp: 47, desc: 'Overcast', humidity: 82, wind: 8,
          visibility: 6, pressure: 1013, feelsLike: 44, uvIndex: 1, type: 'rain'
        };
        if (currentWeatherMode === 'live') {
          applyWeather(liveWeatherData);
          refreshWeatherVisualizations();
        }
      });
  }

  function applyWeather(data) {
    var bg = document.getElementById('weatherBg');
    var particles = document.getElementById('weatherParticles');

    bg.className = 'weather-bg ' + data.type;

    document.getElementById('weatherTemp').textContent = data.temp + '°F';
    document.getElementById('weatherDesc').textContent = data.desc;
    document.getElementById('weatherIcon').textContent = getWeatherIcon(data.type);
    document.getElementById('weatherDetails').textContent =
      'Feels like ' + data.feelsLike + '°F · UV Index ' + data.uvIndex;

    var now = new Date();
    document.getElementById('weatherTimestamp').textContent =
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' · ' + now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

    document.getElementById('weatherHumidity').textContent = data.humidity + '%';
    document.getElementById('humidityBar').style.width = data.humidity + '%';

    document.getElementById('weatherWind').textContent = data.wind + ' mph';
    document.getElementById('windBar').style.width = Math.min(data.wind / 30 * 100, 100) + '%';

    document.getElementById('weatherVisibility').textContent = data.visibility + ' mi';
    document.getElementById('visibilityBar').style.width = Math.min(data.visibility / 10 * 100, 100) + '%';

    document.getElementById('weatherPressure').textContent = data.pressure + ' mb';
    document.getElementById('pressureBar').style.width = Math.min((data.pressure - 960) / 80 * 100, 100) + '%';

    generateParticles(data.type, particles);
  }

  function generateParticles(type, container) {
    container.innerHTML = '';

    if (type === 'rain' || type === 'storm') {
      var count = type === 'storm' ? 120 : 60;
      for (var i = 0; i < count; i++) {
        var drop = document.createElement('div');
        drop.className = 'raindrop';
        drop.style.left = Math.random() * 100 + '%';
        drop.style.height = (Math.random() * 20 + 10) + 'px';
        drop.style.animationDuration = (Math.random() * 0.5 + 0.4) + 's';
        drop.style.animationDelay = Math.random() * 2 + 's';
        drop.style.opacity = type === 'storm'
          ? (Math.random() * 0.3 + 0.3)
          : (Math.random() * 0.3 + 0.2);
        container.appendChild(drop);
      }
      if (type === 'storm') {
        var lightning = document.createElement('div');
        lightning.className = 'lightning';
        lightning.style.animation = 'lightning-flash ' + (Math.random() * 5 + 5) + 's infinite ' + Math.random() * 3 + 's';
        container.appendChild(lightning);
      }
    } else if (type === 'sunny') {
      var ray = document.createElement('div');
      ray.className = 'sun-ray';
      container.appendChild(ray);
    } else if (type === 'cloudy') {
      for (var j = 0; j < 5; j++) {
        var cloud = document.createElement('div');
        cloud.className = 'cloud';
        cloud.style.width = (Math.random() * 400 + 200) + 'px';
        cloud.style.height = (Math.random() * 100 + 50) + 'px';
        cloud.style.top = (Math.random() * 60 + 10) + '%';
        cloud.style.animationDuration = (Math.random() * 40 + 40) + 's';
        cloud.style.animationDelay = -(Math.random() * 40) + 's';
        container.appendChild(cloud);
      }
    }
  }

  function generateHistoryChart() {
    var chart = document.getElementById('weatherHistoryChart');
    if (!chart) return;
    chart.innerHTML = '';

    var currentYear = new Date().getFullYear();
    for (var i = 10; i >= 0; i--) {
      var year = currentYear - i;
      var temp = Math.round(40 + Math.random() * 25);
      var bar = document.createElement('div');
      bar.className = 'history-bar';
      bar.style.height = ((temp - 30) / 40 * 100) + '%';

      var tip = document.createElement('span');
      tip.className = 'history-bar-tip';
      tip.textContent = year + ': ' + temp + '°F';
      bar.appendChild(tip);

      chart.appendChild(bar);
    }
  }

  function generateHourlyForecast() {
    var container = document.getElementById('weatherHourly');
    if (!container) return;
    container.innerHTML = '';

    var now = new Date();
    var baseTemp = liveWeatherData ? liveWeatherData.temp : 47;
    var conditions = ['☀️', '⛅', '☁️', '🌧️', '⛈️', '🌫️'];

    for (var i = 0; i < 24; i++) {
      var hour = new Date(now.getTime() + i * 3600000);
      var timeStr = i === 0 ? 'Now' : hour.toLocaleTimeString('en-US', { hour: 'numeric' });
      var temp = Math.round(baseTemp + Math.sin((i - 6) * Math.PI / 12) * 8 + (Math.random() * 4 - 2));
      var icon = i === 0 && liveWeatherData ? getWeatherIcon(liveWeatherData.type) : conditions[Math.floor(Math.random() * conditions.length)];

      var el = document.createElement('div');
      el.className = 'weather-hour' + (i === 0 ? ' now' : '');
      el.innerHTML =
        '<span class="weather-hour-time">' + timeStr + '</span>' +
        '<span class="weather-hour-icon">' + icon + '</span>' +
        '<span class="weather-hour-temp">' + temp + '°</span>';
      container.appendChild(el);
    }
  }

  function generateWeeklyForecast() {
    var container = document.getElementById('weatherWeekly');
    if (!container) return;
    container.innerHTML = '';

    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var now = new Date();
    var baseTemp = liveWeatherData ? liveWeatherData.temp : 47;
    var conditions = ['☀️', '⛅', '☁️', '🌧️', '⛈️'];

    var allTemps = [];
    var dayData = [];

    for (var i = 0; i < 7; i++) {
      var date = new Date(now.getTime() + i * 86400000);
      var dayName = i === 0 ? 'Today' : days[date.getDay()];
      var low = Math.round(baseTemp - 5 + Math.random() * 4 - 2);
      var high = Math.round(baseTemp + 5 + Math.random() * 6 - 3);
      var icon = conditions[Math.floor(Math.random() * conditions.length)];
      allTemps.push(low, high);
      dayData.push({ dayName: dayName, icon: icon, low: low, high: high });
    }

    var globalMin = Math.min.apply(null, allTemps);
    var globalMax = Math.max.apply(null, allTemps);
    var range = globalMax - globalMin || 1;

    dayData.forEach(function(d) {
      var leftPct = ((d.low - globalMin) / range) * 100;
      var widthPct = ((d.high - d.low) / range) * 100;

      var row = document.createElement('div');
      row.className = 'weather-day-row';
      row.innerHTML =
        '<span class="weather-day-name">' + d.dayName + '</span>' +
        '<span class="weather-day-icon">' + d.icon + '</span>' +
        '<div class="weather-day-bar-container">' +
          '<div class="weather-day-bar" style="left: ' + leftPct + '%; width: ' + widthPct + '%;"></div>' +
        '</div>' +
        '<span class="weather-day-low">' + d.low + '°</span>' +
        '<span class="weather-day-high">' + d.high + '°</span>';
      container.appendChild(row);
    });
  }

  function drawTempSparkline() {
    var canvas = document.getElementById('tempSparkline');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = 150 * dpr;
    ctx.scale(dpr, dpr);

    var w = canvas.offsetWidth;
    var h = 150;
    var padding = { top: 20, bottom: 30, left: 40, right: 20 };

    var baseTemp = liveWeatherData ? liveWeatherData.temp : 47;

    var points = [];
    for (var i = 0; i < 24; i++) {
      var temp = baseTemp + Math.sin((i - 6) * Math.PI / 12) * 8 + (Math.random() * 3 - 1.5);
      points.push(temp);
    }

    var minT = Math.min.apply(null, points) - 2;
    var maxT = Math.max.apply(null, points) + 2;

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
      var gy = padding.top + (h - padding.top - padding.bottom) * (g / 4);
      ctx.beginPath();
      ctx.moveTo(padding.left, gy);
      ctx.lineTo(w - padding.right, gy);
      ctx.stroke();

      var gTemp = Math.round(maxT - (maxT - minT) * (g / 4));
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(gTemp + '°', padding.left - 8, gy + 4);
    }

    ctx.textAlign = 'center';
    for (var t = 0; t < 24; t += 3) {
      var tx = padding.left + (w - padding.left - padding.right) * (t / 23);
      var tHour = new Date();
      tHour.setHours(tHour.getHours() - 23 + t);
      ctx.fillText(tHour.toLocaleTimeString('en-US', { hour: 'numeric' }), tx, h - 8);
    }

    var gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
    gradient.addColorStop(0, 'rgba(212, 160, 83, 0.15)');
    gradient.addColorStop(1, 'rgba(212, 160, 83, 0)');

    ctx.beginPath();
    points.forEach(function(temp, idx) {
      var x = padding.left + (w - padding.left - padding.right) * (idx / (points.length - 1));
      var y = padding.top + (h - padding.top - padding.bottom) * (1 - (temp - minT) / (maxT - minT));
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(w - padding.right, h - padding.bottom);
    ctx.lineTo(padding.left, h - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    points.forEach(function(temp, idx) {
      var x = padding.left + (w - padding.left - padding.right) * (idx / (points.length - 1));
      var y = padding.top + (h - padding.top - padding.bottom) * (1 - (temp - minT) / (maxT - minT));
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#d4a053';
    ctx.lineWidth = 2;
    ctx.stroke();

    points.forEach(function(temp, idx) {
      var x = padding.left + (w - padding.left - padding.right) * (idx / (points.length - 1));
      var y = padding.top + (h - padding.top - padding.bottom) * (1 - (temp - minT) / (maxT - minT));
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#d4a053';
      ctx.fill();
    });
  }

  function drawSunArc() {
    var canvas = document.getElementById('sunArc');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = 120 * dpr;
    ctx.scale(dpr, dpr);

    var w = canvas.offsetWidth;
    var h = 120;
    var cx = w / 2;
    var cy = h - 10;
    var radius = Math.min(w / 2 - 20, h - 20);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, 0, false);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    var now = new Date();
    var sunriseHour = 6.7;
    var sunsetHour = 19.47;
    var currentHour = now.getHours() + now.getMinutes() / 60;
    var dayProgress = Math.max(0, Math.min(1, (currentHour - sunriseHour) / (sunsetHour - sunriseHour)));

    var currentAngle = Math.PI - dayProgress * Math.PI;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, currentAngle, false);
    ctx.strokeStyle = '#d4a053';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    var sunX = cx + radius * Math.cos(currentAngle);
    var sunY = cy + radius * Math.sin(currentAngle);

    var glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 15);
    glow.addColorStop(0, 'rgba(212, 160, 83, 0.4)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(sunX - 15, sunY - 15, 30, 30);

    ctx.beginPath();
    ctx.arc(sunX, sunY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#d4a053';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - radius - 10, cy);
    ctx.lineTo(cx + radius + 10, cy);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function updateUVGauge() {
    var uv = liveWeatherData ? liveWeatherData.uvIndex : 1;
    var marker = document.getElementById('uvMarker');
    var value = document.getElementById('uvValue');
    var desc = document.getElementById('uvDesc');

    if (marker) marker.style.left = Math.min(uv / 11 * 100, 100) + '%';
    if (value) value.textContent = uv;

    var descriptions = ['Low', 'Low', 'Low', 'Moderate', 'Moderate', 'Moderate', 'High', 'High', 'Very High', 'Very High', 'Extreme', 'Extreme'];
    if (desc) desc.textContent = descriptions[Math.min(uv, 11)];
  }

  function refreshWeatherVisualizations() {
    generateHourlyForecast();
    generateWeeklyForecast();
    drawTempSparkline();
    drawSunArc();
    updateUVGauge();
  }

  // Weather picker buttons
  document.querySelectorAll('.weather-pick').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.weather-pick').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');

      var mode = btn.dataset.weather;
      currentWeatherMode = mode;

      if (mode === 'live' && liveWeatherData) {
        applyWeather(liveWeatherData);
        refreshWeatherVisualizations();
      } else if (mode !== 'live') {
        var mockData = {
          sunny: { temp: 72, desc: 'Clear Sky', humidity: 35, wind: 5, visibility: 10, pressure: 1020, feelsLike: 70, uvIndex: 7, type: 'sunny' },
          cloudy: { temp: 55, desc: 'Overcast', humidity: 68, wind: 12, visibility: 7, pressure: 1015, feelsLike: 52, uvIndex: 2, type: 'cloudy' },
          rain: { temp: 47, desc: 'Light Rain', humidity: 88, wind: 15, visibility: 4, pressure: 1008, feelsLike: 42, uvIndex: 1, type: 'rain' },
          storm: { temp: 44, desc: 'Thunderstorm', humidity: 95, wind: 28, visibility: 2, pressure: 998, feelsLike: 38, uvIndex: 0, type: 'storm' },
        };
        applyWeather(mockData[mode]);
        refreshWeatherVisualizations();
      }
    });
  });

  // Timestamp clock
  setInterval(function() {
    var ts = document.getElementById('weatherTimestamp');
    if (ts) {
      var now = new Date();
      ts.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' · ' + now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    }
  }, 1000);

  // Run initial visualizations
  fetchWeather();
  generateHistoryChart();
  refreshWeatherVisualizations();

  // Export to PRES
  PRES.fetchWeather = fetchWeather;
})();
