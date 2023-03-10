import AppServices, { type Query } from "../services/appServices";
import { defineStore } from "pinia";

export interface ShowItem {
  id: string;
  show: {
    name?: string;
    image?: { medium: string; original: string };
    genres: Array<string>;
    id: string;
  };
  image?: { medium: string; original: string };
  name?: string;
  rating: {
    average: number | "null";
  };
  genres: Array<string>;
}

export const useShowsStore = defineStore("shows", {
  state: () => ({
    /** @type {string} */
    baseUrl: "",
    /** @type {object} */
    itemInfo: {},
    /** @type {string} */
    selectedGenre: "",
    /** @type {[object]} */
    results: [],
    /** @type {boolean} */
    loading: false,
    /** @type {number} */
    page: 1,
    /** @type {number} */
    totalPages: 1,
    /** @type {null | object} */
    error: null,
  }),
  getters: {
    getSelectedGenre: (state) => {
      return state.selectedGenre;
    },
    sortedShows: (state) => {
      const results = state.results.filter(function (item: ShowItem) {
        return item.rating.average !== null && item.rating.average !== "null";
      });

      return results.sort((a: ShowItem, b: ShowItem) => {
        if (a.rating.average !== null) {
          if (a.rating.average < b.rating.average) {
            return 1;
          }
          if (a.rating.average > b.rating.average) {
            return -1;
          }
        }
      });
    },
    filteredGenre: (state) => {
      let results = state.results;

      if (
        state.selectedGenre != "" &&
        state.selectedGenre != null &&
        state.selectedGenre != "all"
      ) {
        if (state.results) {
          results = state.results.filter((item: ShowItem) => {
            return item && item.show
              ? item.show.genres.includes(state.selectedGenre)
              : item.genres.includes(state.selectedGenre);
          });
        }
      }

      return results;
    },

    /**
     * @returns {{ text: string, id: number, isFinished: boolean }[]}
     */
  },
  actions: {
    async fetchShows(action: string) {
      if (action == "INIT") {
        this.results = [];
        this.page = 1;
        this.loading = true;
      } else {
        this.page++;
        this.loading = true;
      }
      try {
        const response = await AppServices.getShows(this.page);
        this.results =
          action == "INIT" ? response.data : this.results.concat(response.data);
        this.setTotalPages(Math.round(this.results.length / 250));
      } catch (e: any) {
        if (action == "MORE") this.page--;
        this.error = e;
      } finally {
        this.loading = false;
      }
    },
    async fetchCountryShows(action: string) {
      if (action == "INIT") {
        this.results = [];
        this.page = 1;
        this.loading = true;
      } else {
        this.page++;
        this.loading = true;
      }
      try {
        const response = await AppServices.getShowsByCountry();
        this.results =
          action == "INIT" ? response.data : this.results.concat(response.data);
        this.setTotalPages(Math.round(this.results.length / 250));
      } catch (e: any) {
        if (action == "MORE") this.page--;
        this.error = e;
      } finally {
        this.loading = false;
      }
    },

    async searchShows(action: string, query: Query) {
      if (action == "INIT") {
        this.page = 1;
        this.loading = true;
        this.results = [];
      } else {
        this.page++;
        this.loading = true;
      }
      try {
        const response = await AppServices.search(query, this.page);
        this.results = response.data;
        this.setTotalPages(Math.round(this.results.length / 250));
      } catch (e: any) {
        if (action == "MORE") this.page--;
        this.error = e;
      } finally {
        this.loading = false;
        this.loading = false;
      }
    },
    getItem: async function (item: ShowItem) {
      this.resetItem();
      const itemId = item && item.show ? item.show.id : item.id;
      const [responseCast, responseSeasons, responseEpisodes] =
        await Promise.all([
          AppServices.getCast(itemId),
          AppServices.getSeasons(itemId),
          AppServices.getEpisodes(itemId),
        ]);

      this.loadItem({
        info: item,
        cast: responseCast.data,
        seasons: responseSeasons.data.length,
        episodes: responseEpisodes.data.length,
      });
    },

    loadConf(baseUrl: string) {
      this.baseUrl = baseUrl;
    },
    resetItem() {
      this.itemInfo = {};
    },
    loadItem({ info, cast, seasons, episodes }: any) {
      const itemInfo = info;
      let castDetails = "";
      cast.forEach((element: any) => {
        if (castDetails !== "") {
          castDetails = castDetails + ", " + element.person.name;
        } else {
          castDetails = element.person.name;
        }
      });
      itemInfo.cast = castDetails;
      itemInfo.seasons = seasons;
      itemInfo.episodes = episodes;
      this.itemInfo = itemInfo;
    },
    changeGenre(value: string) {
      this.selectedGenre = value;
    },
    setTotalPages(total: number) {
      this.totalPages = total;
    },
  },
});
