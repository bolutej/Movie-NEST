// DOM elements
const swap = document.getElementById("swap");
const searchForm = document.getElementById("search-form");
const searchBox = document.getElementById("search-box");

const searchMov = document.getElementById("searchMov");
const trending = document.getElementById("trending");
const upcoming = document.getElementById("upcoming");
const comedy = document.getElementById("comedy");
const horror = document.getElementById("horror");

const searchH3 = document.getElementById("searchH3");
const T = document.querySelector(".T");
const U = document.querySelector(".U");
const C = document.querySelector(".C");
const H = document.querySelector(".H");
const moviesLoader = document.getElementById("movies-loader");
const searchLoader = document.getElementById("search-loader");

// Modal Box
const movieModal = document.getElementById("movie-modal");
const modalContent = document.getElementById("modal-content");
const closeModalBtn = document.getElementById("close-modal");

// API
const API_KEY = "4831c138970a601533d8dbe21c30663d";
const POSTER_URL = "https://image.tmdb.org/t/p/w500";
const MOVIE_URL = "https://www.themoviedb.org/movie/";
const BASE_URL = "https://api.themoviedb.org/3";
const seenByContainer = new WeakMap();

// Theme toggle (dark/light)
swap.addEventListener("click", () => {
  swap.classList.toggle("fa-moon");
  document.querySelector("body").classList.toggle("darkmode");
});

function showMoviesLoader() {
  if (moviesLoader) {
    moviesLoader.classList.add("show");
  }
}

function hideMoviesLoader() {
  if (moviesLoader) {
    moviesLoader.classList.remove("show");
    moviesLoader.textContent = "";
    moviesLoader.style.display = "none";
  }
}

function showSearchLoader() {
  if (searchLoader) {
    searchLoader.classList.add("show");
  }
}

function hideSearchLoader() {
  if (searchLoader) {
    searchLoader.classList.remove("show");
  }
}

function hideSuggestions() {
  const suggestions = document.getElementById("suggestions");
  if (suggestions) {
    suggestions.innerHTML = "";
    suggestions.style.display = "none";
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSeenSet(container) {
  let set = seenByContainer.get(container);
  if (!set) {
    set = new Set();
    seenByContainer.set(container, set);
  }
  return set;
}

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

// Pagination state
const pageState = {
  trending: { page: 1, loading: false, hasMore: true },
  upcoming: { page: 1, loading: false, hasMore: true },
  comedy: { page: 1, loading: false, hasMore: true },
  horror: { page: 1, loading: false, hasMore: true },
  search: { page: 1, loading: false, hasMore: true, query: "" },
};

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

// Re-render all content rows using current rating filter.
function filterByRating() {
  displayMovies(getFilteredMovies(tMovies), trending);
  displayMovies(getFilteredMovies(uMovies), upcoming);
  displayMovies(getFilteredMovies(cMovies), comedy);
  displayMovies(getFilteredMovies(hMovies), horror);
}

// Fetches all home sections in parallel and renders initial cards.
async function loadMovies() {
  showMoviesLoader();

  try {
    const [trendingData, upcomingData, comedyData, horrorData] = await Promise.all([
      fetch(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}&page=1`).then((res) => {
        if (!res.ok) throw new Error(`Trending failed: ${res.status}`);
        return res.json();
      }),
      fetch(`${BASE_URL}/movie/upcoming?api_key=${API_KEY}&page=1`).then((res) => {
        if (!res.ok) throw new Error(`Upcoming failed: ${res.status}`);
        return res.json();
      }),
      fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=35&page=1`).then((res) => {
        if (!res.ok) throw new Error(`Comedy failed: ${res.status}`);
        return res.json();
      }),
      fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=27&page=1`).then((res) => {
        if (!res.ok) throw new Error(`Horror failed: ${res.status}`);
        return res.json();
      }),
    ]);

    // store results
    tMovies = trendingData.results;
    uMovies = upcomingData.results;
    cMovies = comedyData.results;
    hMovies = horrorData.results;

    // display all fetched cards per section.
    await Promise.all([
      displayMovies(tMovies, trending),
      displayMovies(uMovies, upcoming),
      displayMovies(cMovies, comedy),
      displayMovies(hMovies, horror),
    ]);

    setupInfiniteScroll("trending", trending);
    setupInfiniteScroll("upcoming", upcoming);
    setupInfiniteScroll("comedy", comedy);
    setupInfiniteScroll("horror", horror);
  } catch (error) {
    console.error("Failed to load movies:", error);
    trending.innerHTML = "<p>Something went wrong. Please try again.</p>";
  } finally {
    hideMoviesLoader();
  }
}

async function fetchMoreMovies(section) {
  const state = pageState[section];
  if (state.loading || !state.hasMore) return;

  state.loading = true;
  state.page++;

  const urls = {
    trending: `${BASE_URL}/trending/movie/day?api_key=${API_KEY}&page=${state.page}`,
    upcoming: `${BASE_URL}/movie/upcoming?api_key=${API_KEY}&page=${state.page}`,
    comedy: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=35&page=${state.page}`,
    horror: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=27&page=${state.page}`,
  };

  try {
    const res = await fetch(urls[section]);
    const data = await res.json();

    if (!data.results.length || state.page >= data.total_pages) {
      state.hasMore = false;
    }

    if (section === "trending") tMovies.push(...data.results);
    if (section === "upcoming") uMovies.push(...data.results);
    if (section === "comedy") cMovies.push(...data.results);
    if (section === "horror") hMovies.push(...data.results);

    const containers = { trending, upcoming, comedy, horror };
    await appendMovies(data.results, containers[section]);
  } catch (err) {
    console.error(`Failed to load more ${section}:`, err);
    state.page--;
  } finally {
    state.loading = false;
  }
}

// Gets the US content certification for a movie (PG-13, R, etc.).
async function getCertification(movieId) {
  try {
    const response = await fetch(`${BASE_URL}/movie/${movieId}/release_dates?api_key=${API_KEY}`);
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

async function appendMovies(movies, container) {
  const moviesWithPosters = movies.filter((m) => m.poster_path !== null);
  const seen = getSeenSet(container);

  const certs = await Promise.all(moviesWithPosters.map((movie) => getCertification(movie.id)));

  const genreRes = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
  const genreData = await genreRes.json();
  const genres = genreData.genres;

  moviesWithPosters.forEach((movie, index) => {
    if (seen.has(movie.id)) {
      return;
    }
    seen.add(movie.id);
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
    card.dataset.movieId = String(movie.id);
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

// Builds movie cards for a section and wires the details modal action.
async function displayMovies(movies, container) {
  container.innerHTML = "";
  seenByContainer.set(container, new Set());

  const moviesWithPosters = movies.filter((movie) => movie.poster_path !== null);
  const certs = await Promise.all(moviesWithPosters.map((movie) => getCertification(movie.id)));
  const genreRes = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
  const genreData = await genreRes.json();
  const genres = genreData.genres;

  const seen = getSeenSet(container);
  moviesWithPosters.forEach((movie, index) => {
    if (seen.has(movie.id)) {
      return;
    }
    seen.add(movie.id);
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
    card.dataset.movieId = String(movie.id);

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
    const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}`);
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
  const q = searchBox.value.trim();
  if (!q) {
    hideSearchLoader();
    return;
  }

  pageState.search.query = q;
  pageState.search.page = 1;
  pageState.search.hasMore = true;

  hideSuggestions();
  showSearchLoader();
  clearAll();
  searchMov.innerHTML = "";
  searchH3.innerHTML = `Search for ${q}`;
  await delay(250);
  await fetchMoreSearch();
}

async function fetchMoreSearch() {
  const state = pageState.search;
  if (state.loading || !state.hasMore) return;

  state.loading = true;
  showSearchLoader();

  try {
    const res = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${state.query}&page=${state.page}`,
    );
    const data = await res.json();

    if (!data.results.length || state.page >= data.total_pages) {
      state.hasMore = false;
    }

    const results = data.results.filter(
      (r) => r.poster_path !== null && r.title !== null,
    );

    await appendMovies(results, searchMov);
    state.page++;
  } catch (error) {
    console.error("Search failed:", error);
    searchMov.innerHTML = "<p>Search failed. Please try again.</p>";
  } finally {
    state.loading = false;
    hideSearchLoader();
  }
}

// Search form submit runs a full search.
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  searchMovies();
});

// Input event uses debounced suggestions endpoint.
searchBox.addEventListener("input", debounce(fetchSuggestions, 300));

// Clicking outside search form closes suggestions dropdown.
document.addEventListener("click", (e) => {
  if (!e.target.closest("#search-form")) {
    document.getElementById("suggestions").style.display = "none";
  }
});

function setupInfiniteScroll(section, container) {
  const sentinel = document.createElement("div");
  sentinel.className = "scroll-sentinel";
  container.appendChild(sentinel);

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        fetchMoreMovies(section);
      }
    },
    {
      root: container,
      rootMargin: "0px 400px 0px 0px",
      threshold: 0,
    },
  );

  observer.observe(sentinel);
}

// Hide category rows while search results are displayed.
function clearAll() {
  T.style.display = "none";
  U.style.display = "none";
  C.style.display = "none";
  H.style.display = "none";
}

// Initial app boot.
loadMovies();

const searchSentinel = document.getElementById("search-sentinel");
if (searchSentinel) {
  new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        fetchMoreSearch();
      }
    },
    { threshold: 0.1 },
  ).observe(searchSentinel);
}
