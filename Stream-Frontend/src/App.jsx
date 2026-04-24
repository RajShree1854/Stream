import Home from "./pages/Home";
import MovieDetails from "./pages/MovieDetails";
import TvDetails from "./pages/TvDetails";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import Stremio from "./pages/Stremio";
import SimilarMov from "./pages/SimilarMov";
import SimilarSeries from "./pages/SimilarSeries";
import SearResults from "./pages/SearchResults";
import Token from "./pages/Token";
import NotFoundPage from "./pages/NotFound";
import Login from "./pages/Login";

import Nav from "./components/Nav";
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";

import { AuthProvider } from "./context/AuthContext";

import ReactGa from "react-ga";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { BrowserRouter, Route, Routes } from "react-router-dom";


function App() {
  ReactGa.initialize("");
  useEffect(() => {
    ReactGa.pageview(window.location.pathname + window.location.search);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav />
        <div className="p-3 md:p-10">

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute element={<Home />} />} />
            <Route
              path="mov/:movieID"
              element={<PrivateRoute element={<MovieDetails />} />}
            />
            <Route
              path="ser/:seriesID"
              element={<PrivateRoute element={<TvDetails />} />}
            />
            <Route
              path="/Movies"
              element={<PrivateRoute element={<Movies />} />}
            />
            <Route
              path="/Series"
              element={<PrivateRoute element={<Series />} />}
            />
            <Route
              path="/Stremio"
              element={<PrivateRoute element={<Stremio />} />}
            />
            <Route
              path="*"
              element={<PrivateRoute element={<NotFoundPage />} />}
            />
            <Route
              path="/similarMov/:movieID"
              element={<PrivateRoute element={<SimilarMov />} />}
            />
            <Route
              path="/similarSeries/:seriesID"
              element={<PrivateRoute element={<SimilarSeries />} />}
            />
            <Route
              path="/token/:tokenID"
              element={<PrivateRoute element={<Token />} />}
            />
            <Route
              path="/search/:searchResult"
              element={<PrivateRoute element={<SearResults />} />}
            />
          </Routes>
        </div>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
