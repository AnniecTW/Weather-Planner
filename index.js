import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 3000;

// for weather suggestion
const weatherTips = {
  0: { suggestion: "Perfect for outdoor plans! ☀️\n", className: "card-clear" },

  1: {
    suggestion: "Partly cloudy, but still a good day to be out! 🌤️\n",
    className: "card-cloudy",
  },
  2: {
    suggestion: "Partly cloudy, but still a good day to be out! 🌤️\n",
    className: "card-cloudy",
  },
  3: {
    suggestion: "Overcast skies — maybe plan something cozy indoors. ☁️\n",
    className: "card-cloudy",
  },

  45: {
    suggestion: "Foggy out there — drive safe and go slow. 🌫️\n",
    className: "card-foggy",
  },
  48: {
    suggestion:
      "Rime fog incoming! Watch your step, it might be slippery. ❄️🌫️\n",
    className: "card-foggy",
  },

  51: {
    suggestion: "Light drizzle — grab a light jacket or an umbrella. 🌦️\n",
    className: "card-drizzle",
  },
  53: {
    suggestion:
      "Moderate drizzle — an umbrella is your best friend today. ☔\n",
    className: "card-drizzle",
  },
  55: {
    suggestion: "Heavy drizzle — keep dry and take cover when you can. 🌧️\n",
    className: "card-drizzle",
  },

  56: {
    suggestion: "Light freezing drizzle — watch out for slippery roads! ❄️🧊\n",
    className: "card-snowy",
  },
  57: {
    suggestion: "Dense freezing drizzle — stay safe, it’s icy out there. 🧊\n",
    className: "card-snowy",
  },

  61: {
    suggestion: "Light rain — don’t forget your umbrella. ☔\n",
    className: "card-rainy",
  },
  63: {
    suggestion: "Moderate rain — good day to stay in with hot cocoa. 🌧️\n",
    className: "card-rainy",
  },
  65: {
    suggestion: "Heavy rain — take cover and maybe delay that picnic. ⛈️\n",
    className: "card-rainy",
  },

  66: {
    suggestion: "Freezing rain — seriously, stay inside if you can. ❄️🌧️\n",
    className: "card-snowy",
  },
  67: {
    suggestion: "Heavy freezing rain — everything's an ice rink. 🧊⛸️\n",
    className: "card-snowy",
  },

  71: {
    suggestion: "Light snow — make a tiny snowman! ☃️\n",
    className: "card-snowy",
  },
  73: {
    suggestion: "Moderate snow — bundle up, it’s getting magical. ❄️\n",
    className: "card-snowy",
  },
  75: {
    suggestion: "Heavy snow — cancel all plans and build a fort. 🏰❄️\n",
    className: "card-snowy",
  },

  77: {
    suggestion: "Snow grains — looks like powdered sugar out there. 🍥\n",
    className: "card-snowy",
  },

  80: {
    suggestion: "Light rain showers — could pass quickly, but still wet. 🌦️\n",
    className: "card-rainy",
  },
  81: {
    suggestion: "Moderate rain showers — umbrella and waterproof shoes! ☔👢\n",
    className: "card-rainy",
  },
  82: {
    suggestion: "Violent showers — might wanna reschedule that walk. ⛈️\n",
    className: "card-rainy",
  },

  85: {
    suggestion: "Light snow showers — feels like a postcard scene. ❄️📬\n",
    className: "card-snowy",
  },
  86: {
    suggestion: "Heavy snow showers — blizzard vibes, stay cozy. 🌨️\n",
    className: "card-snowy",
  },

  95: {
    suggestion: "Thunderstorm — cue the dramatic music. ⚡🌩️\n",
    className: "card-thunderstorm",
  },
  96: {
    suggestion: "Thunderstorm with hail — definitely stay indoors! ⛈️🧊\n",
    className: "card-thunderstorm",
  },
  99: {
    suggestion: "Severe hailstorm — skip the errands today. 🚫🧊\n",
    className: "card-thunderstorm",
  },
};

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.post("/", async (req, res) => {
  const loc = req.body.loc;
  try {
    // get location
    const geoRes = await axios.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${loc}&count=1&language=en&format=json`
    );
    const city = geoRes.data.results[0];
    const lat = city.latitude;
    const lon = city.longitude;

    // get weather forcast
    const weatherRes = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,relative_humidity_2m_mean,wind_speed_10m_max&timezone=GMT`
    );
    const dailyWeather = weatherRes.data.daily.weather_code.map((code, i) => {
      const uv = weatherRes.data.daily.uv_index_max[i];
      const wind = weatherRes.data.daily.wind_speed_10m_max[i];

      // basic suggestion
      let suggestion = weatherTips[code]?.suggestion || "";

      // extra suggestion
      if (uv > 6) {
        suggestion +=
          "High UV index — don’t forget sunscreen or a parasol!🧴\n";
      }
      if (wind > 38) {
        suggestion += "Winds are wild today — hold onto your hat!💨";
      }

      // No suggestion
      if (!suggestion) {
        suggestion = "No advice available 🤷‍♀️";
      }

      const date = new Date(weatherRes.data.daily.time[i]);
      const day = date.getDay();
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];

      return {
        date: weatherRes.data.daily.time[i],
        day: dayNames[day],
        max: weatherRes.data.daily.temperature_2m_max[i],
        min: weatherRes.data.daily.temperature_2m_min[i],
        suggestion,
        uv,
        wind,
        humid: weatherRes.data.daily.relative_humidity_2m_mean[i],
        className: weatherTips[code]?.className || "card-default",
      };
    });
    res.render("index.ejs", { days: dailyWeather || [] });
  } catch (error) {
    const errorMsg = error.response?.data || error.message || "Unknown error";
    res.render("index.ejs", { error: JSON.stringify(errorMsg) });
  }
});

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
