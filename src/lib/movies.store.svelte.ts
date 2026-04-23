/**
 * MOVIES STORE - Gestión centralizada de películas (Svelte 5 Runes)
 * 
 * Equivalente a MovieProvider en Flutter.
 * Usa runes para estado reactivo global.
 */

import { api } from './api.service';
import type { Movie, MoviePayload } from './types';

// Estado reactivo global con Svelte 5 runes
let movies = $state<Movie[]>([]);
let loading = $state(false);
let mutating = $state(false);
let error = $state<string | null>(null);

// API pública del store
export const moviesStore = {
  // Getters reactivos
  get movies() { return movies; },
  get loading() { return loading; },
  get mutating() { return mutating; },
  get error() { return error; },

  // Cargar todas las películas
  async loadMovies() {
    loading = true;
    error = null;
    try {
      movies = await api.getMovies();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al cargar películas';
    } finally {
      loading = false;
    }
  },

  // Crear película
  async createMovie(payload: MoviePayload): Promise<boolean> {
    mutating = true;
    error = null;
    try {
      const newMovie = await api.createMovie(payload);
      movies = [...movies, newMovie];
      return true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al crear película';
      return false;
    } finally {
      mutating = false;
    }
  },

  // Actualizar película
  async updateMovie(id: string, payload: MoviePayload): Promise<boolean> {
    mutating = true;
    error = null;
    try {
      const updatedMovie = await api.updateMovie(id, payload);
      movies = movies.map(m => m.id === id ? updatedMovie : m);
      return true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al actualizar película';
      return false;
    } finally {
      mutating = false;
    }
  },

  // Eliminar película
  async deleteMovie(id: string): Promise<boolean> {
    mutating = true;
    error = null;
    try {
      await api.deleteMovie(id);
      movies = movies.filter(m => m.id !== id);
      return true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al eliminar película';
      return false;
    } finally {
      mutating = false;
    }
  },

  // Actualizar valoración de una película con optimistic update
  async rateMovie(movie: Movie, rating: number): Promise<boolean> {
    // 1. Validación
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      error = 'La valoración debe ser un número entero entre 0 y 5';
      return false;
    }

    // 2. Guardar estado previo para posible rollback
    const previousRating = movie.rating;
    
    // 3. Optimistic Update (Mutación directa - Svelte 5)
    movie.rating = rating;
    error = null;

    try {
      // 4. Persistir en el backend
      const updatedMovie = await api.rateMovie(movie.id, rating);
      
      // Asegurar que el objeto se queda con la versión de la DB
      movie.rating = updatedMovie.rating;
      return true;
    } catch (err) {
      // 5. Rollback en caso de error
      movie.rating = previousRating;
      error = err instanceof Error ? err.message : 'Error al puntuar la película';
      return false;
    }
  },

  // Limpiar estado completo
  reset() {
    movies = [];
    loading = false;
    mutating = false;
    error = null;
  },

  // Limpiar solo el error
  clearError() {
    error = null;
  }
};
