import "node-fetch";
import { Show, Cast } from "./interface";
import { ScraperError } from "./error";

export const scrapeShowsPage = async (page: number = 0): Promise<Show[]> => {
  const response = await fetch(`http://api.tvmaze.com/shows?page=${page}`);
  if (response.status !== 200) {
    throw new ScraperError(response.status);
  }

  const responseJson = await response.json();

  return responseJson;
};

export const scrapeShowCast = async (showId: number): Promise<Cast[]> => {
  const response = await fetch(`http://api.tvmaze.com/shows/${showId}/cast`);
  if (response.status !== 200) {
    throw new ScraperError(response.status);
  }
  const responseJson = await response.json();

  return responseJson;
};
