// Dom 
let swap = document.getElementById("swap");
let container = document.getElementsByClassName("container");
let searchForm = document.getElementById("search-form");
let searchBox = document.getElementById("search-box");

let searchMov = document.getElementById("searchMov");
let trending = document.getElementById("trending");
let upcoming = document.getElementById("upcoming");
let comedy = document.getElementById("comedy");
let horror = document.getElementById("horror");

let searchH3 = document.getElementById("searchH3");
let T = document.querySelector(".T");
let U = document.querySelector(".U");
let C = document.querySelector(".C");
let H = document.querySelector(".H");

// Modal Box
const movieModal = document.getElementById("movie-modal");
const modalContent = document.getElementById("modal-content");
const closeModalBtn = document.getElementById("close-modal");

// API 
let API_KEY = "4831c138970a601533d8dbe21c30663d";
let query = " ";
const POSTER_URL = "https://image.tmdb.org/t/p/w500";
const MOVIE_URL = "https://www.themoviedb.org/movie/";
let page = 1;

// Theme toggle (dark/light)
swap.addEventListener("click", () => {
  swap.classList.toggle("fa-moon");
  document.querySelector("body").classList.toggle("darkmode");
});

const BASE_URL = "https://api.themoviedb.org/3";

// open Movie Modal.
function openMovieModal(movie, cert, movieGenres) {
  modalContent.innerHTML = `
    <div class="movie-modal__body">
      <div class="movie-modal__poster">
        <img src="${POSTER_URL + movie.poster_path}" alt="${movie.title} poster" />
      </div>
      <div class="movie-modal__meta">
        <h2 id="modal-title">${movie.title}</h2>
        <div class="movie-modal__chips">
          <span>${cert || "NR"}</span>
          <span>Rating ${movie.vote_average.toFixed(1)}</span>
          <span>${(movieGenres && movieGenres.join(", ")) || "Genre N/A"}</span>
        </div>
        <p class="movie-modal__overview">${movie.overview || "No description available."}</p>
        <div class="movie-modal__actions">
          <a href="${MOVIE_URL + movie.id}" target="_blank">Open in TMDB</a>
        </div>
      </div>
    </div>
  `;

  movieModal.classList.add("show");
  movieModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

// removing movie modal
function closeMovieModal() {
  movieModal.classList.remove("show");
  movieModal.setAttribute("aria-hidden", "true");
  modalContent.innerHTML = "";
  document.body.style.overflow = "";
}

// Close modal with close button, backdrop click, or Escape key.
closeModalBtn.addEventListener("click", closeMovieModal);
movieModal.addEventListener("click", (e) => {
  if (e.target.hasAttribute("data-close-modal")) {
    closeMovieModal();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && movieModal.classList.contains("show")) {
    closeMovieModal();
  }
});

// each array of movies storage.
let tMovies = [],
  uMovies = [],
  cMovies = [],
  hMovies = [];

// Number of items currently visible per section.
let tVisible = 7,
  uVisible = 7,
  cVisible = 7,
  hVisible = 7;

// Active minimum rating selected by the user.
let selectedRating = 0;

// Re-render all sections when rating filter changes.
document.getElementById("rating-filter").addEventListener("change", (e) => {
  selectedRating = parseFloat(e.target.value);
  filterByRating();
});

// Utility: apply current rating threshold to a movie array.
function getFilteredMovies(movies) {
  return movies.filter((movie) => movie.vote_average >= selectedRating);
}

// Re-render all content rows using current rating + visible counts.
function filterByRating() {
  displayMovies(getFilteredMovies(tMovies), tVisible, trending);
  displayMovies(getFilteredMovies(uMovies), uVisible, upcoming);
  displayMovies(getFilteredMovies(cMovies), cVisible, comedy);
  displayMovies(getFilteredMovies(hMovies), hVisible, horror);
}

// Fetches all home sections in parallel and renders initial cards.
async function loadMovies() {
  try {
    const [trendingData, upcomingData, comedyData, horrorData] =
      await Promise.all([
        fetch(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}`).then(
          (res) => {
            if (!res.ok) throw new Error(`Trending failed: ${res.status}`);
            return res.json();
          },
        ),
        fetch(`${BASE_URL}/movie/upcoming?api_key=${API_KEY}`).then((res) => {
          if (!res.ok) throw new Error(`Upcoming failed: ${res.status}`);
          return res.json();
        }),
        fetch(
          `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=35`,
        ).then((res) => {
          if (!res.ok) throw new Error(`Upcoming failed: ${res.status}`);
          return res.json();
        }),
        fetch(
          `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=27`,
        ).then((res) => {
          if (!res.ok) throw new Error(`Upcoming failed: ${res.status}`);
          return res.json();
        }),
      ]);

    // store results
    tMovies = trendingData.results;
    uMovies = upcomingData.results;
    cMovies = comedyData.results;
    hMovies = horrorData.results;

    // display initial 6
    displayMovies(tMovies, tVisible, trending);
    displayMovies(uMovies, uVisible, upcoming);
    displayMovies(cMovies, cVisible, comedy);
    displayMovies(hMovies, hVisible, horror);
  } catch (error) {
    console.error("Failed to load movies:", error);
    trending.innerHTML = "<p>Something went wrong. Please try again.</p>";
  }
}

// Gets the US content certification for a movie (PG-13, R, etc.).
async function getCertification(movieId) {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}/release_dates?api_key=${API_KEY}`,
    );
    const data = await response.json();

    const usRelease = data.results.find((r) => r.iso_3166_1 === "US");

    if (usRelease) {
      const certification = usRelease.release_dates[0].certification;
      return certification || "NR";
    }
    return "NR";
  } catch (error) {
    console.error("Failed to get certification:", error);
    return "NR";
  }
}

// Builds movie cards for a section and wires the details modal action.
async function displayMovies(movies, count, container) {
  container.innerHTML = "";

  const moviesWithPosters = movies.filter(
    (movie) => movie.poster_path !== null,
  );
  const certs = await Promise.all(
    moviesWithPosters.map((movie) => getCertification(movie.id)),
  );
  const genreRes = await fetch(
    `${BASE_URL}/genre/movie/list?api_key=${API_KEY}`,
  );
  const genreData = await genreRes.json();
  const genres = genreData.genres;

  moviesWithPosters.slice(0, count).forEach((movie, index) => {
    const cert = certs[index];
    const movieGenres = movie.genre_ids.map((id) => {
      const genre = genres.find((g) => g.id === id);
      return genre ? genre.name : "";
    });

    const img = document.createElement("img");
    img.src = POSTER_URL + movie.poster_path;

    const title = document.createElement("p");
    title.textContent = movie.title;

    const card = document.createElement("div");

    const link = document.createElement("a");
    link.href = MOVIE_URL + movie.id;
    link.target = "_blank";

    const viewDetailsBtn = document.createElement("button");
    viewDetailsBtn.classList.add("view-details-btn");
    viewDetailsBtn.type = "button";
    viewDetailsBtn.textContent = "View Details";

    const post = document.createElement("div");
    link.appendChild(img);
    post.appendChild(link);
    post.appendChild(title);
    post.appendChild(viewDetailsBtn);

    card.appendChild(post);
    container.appendChild(card);

    viewDetailsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openMovieModal(movie, cert, movieGenres);
    });
  });
}

// Basic debounce to limit API calls while typing.
function debounce(func, delay) {
  let timeout;
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(func, delay);
  };
}

// Live autocomplete suggestions for search input.
async function fetchSuggestions() {
  const query = searchBox.value.trim();
  const suggestions = document.getElementById("suggestions");
  if (query === "") {
    suggestions.innerHTML = "";
    suggestions.style.display = "none";
    return;
  }
  try {
    const response = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}`,
    );
    const data = await response.json();

    const results = data.results
      .filter((movie) => movie.poster_path !== null)
      .slice(0, 5);

    suggestions.innerHTML = "";
    suggestions.style.display = "block";

    results.forEach((movie) => {
      const div = document.createElement("div");

      const img = document.createElement("img");
      img.src = POSTER_URL + movie.poster_path;

      const title = document.createElement("p");
      title.textContent = movie.title;

      div.appendChild(img);
      div.appendChild(title);
      suggestions.appendChild(div);

      div.addEventListener("click", () => {
        searchBox.value = movie.title;
        suggestions.innerHTML = "";
        suggestions.style.display = "none";
        searchMovies();
      });
    });
  } catch (error) {
    console.error("Suggestions failed:", error);
  }
}

// Executes movie search and shows results grid.
async function searchMovies() {
  query = searchBox.value;
  try {
    if (query === " ") return;
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${query}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const results = data.results.filter(
      (result) => result.poster_path !== null && result.title !== null,
    );

    clearAll();
    if (searchBox.value.length === 0) {
      searchMov.innerHTML = "<p>No movies found. Try a different search.</p>";
      return;
    } else {
      searchMov.innerHTML = "";
    }

    searchH3.innerHTML = `Search for ${searchBox.value}:`;

    for (const result of results) {
      const img = document.createElement("img");
      img.src = POSTER_URL + result.poster_path;
      const title = document.createElement("p");
      title.textContent = result.title;
      const div = document.createElement("div");
      const link = document.createElement("a");
      link.href = MOVIE_URL + result.id;
      link.target = "_blank";

      link.appendChild(img);
      div.appendChild(link);
      div.appendChild(title);
      searchMov.appendChild(div);
    }
  } catch (error) {
    console.error("Search failed:", error);
    searchMov.innerHTML = "<p>Search failed. Please try again.</p>";
  }
}

// "Show more" handlers per section.
document.getElementById("show-more-trending").addEventListener("click", () => {
  tVisible += 6;
  displayMovies(getFilteredMovies(tMovies), tVisible, trending);
});
document.getElementById("show-more-upcoming").addEventListener("click", () => {
  uVisible += 6;
  displayMovies(getFilteredMovies(uMovies), uVisible, upcoming);
});
document.getElementById("show-more-comedy").addEventListener("click", () => {
  cVisible += 6;
  displayMovies(getFilteredMovies(cMovies), cVisible, comedy);
});
document.getElementById("show-more-horror").addEventListener("click", () => {
  hVisible += 6;
  displayMovies(getFilteredMovies(hMovies), hVisible, horror);
});

// Search form submit runs a full search.
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  searchMovies();
});

// Input event uses debounced suggestions endpoint.
searchBox.addEventListener(
  "input",
  debounce(fetchSuggestions, 300),
);

// Clicking outside search form closes suggestions dropdown.
document.addEventListener("click", (e) => {
  if (!e.target.closest("#search-form")) {
    document.getElementById("suggestions").style.display = "none";
  }
});

// Hide category rows while search results are displayed.
function clearAll() {
  T.style.display = "none";
  U.style.display = "none";
  C.style.display = "none";
  H.style.display = "none";
}

// Restore all category rows (kept for reuse).
function showAll() {
  T.style.display = "block";
  U.style.display = "block";
  C.style.display = "block";
  H.style.display = "block";
}

// Initial app boot.
loadMovies();




