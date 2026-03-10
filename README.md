# Marquee Movie App

Marquee is a movie discovery web app powered by The Movie Database (TMDB) API.
It lets users browse trending, upcoming, comedy, and horror movies, search titles,
view movie details, and filter by minimum rating.

## Features

- Browse movie sections: Trending, Upcoming, Comedy, and Horror
- Infinite scroll loading for category rows
- Search movies with live autocomplete suggestions
- Movie detail modal (rating, certification, genres, overview, and TMDB link)
- Rating filter (`All`, `8+`, `7+`, `5+`, `3+`)
- Dark/light mode toggle
- Branded favicon and footer
- Startup loading animation while initial movie data is fetched

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- TMDB REST API
- Font Awesome icons

## Project Structure

- `index.html` - page structure and sections
- `style.css` - app styling, layout, theme, and animations
- `script.js` - data fetching, rendering, search, modal, and infinite scroll
- `favicon.svg` / `favicon.png` - app icon assets

## Setup

1. Clone or download the project.
2. Open the project folder in VS Code.
3. Run with a local server (recommended), for example the Live Server extension.

## Configuration

The TMDB API key is currently defined in `script.js`:

```js
const API_KEY = "your_api_key";
```

If you want to use your own key, replace the existing value with your TMDB API key.

## Usage

1. Open the app in your browser.
2. Wait for the initial loading animation to complete.
3. Browse categories or search for a movie.
4. Click `View Details` to open the movie modal.
5. Use the rating filter and theme toggle as needed.

## Notes

- Search results use infinite loading at the bottom sentinel.
- Movie certifications are fetched from US release data when available.
