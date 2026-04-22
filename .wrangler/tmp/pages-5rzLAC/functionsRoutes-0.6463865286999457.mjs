import { onRequestGet as __api_leaderboard_js_onRequestGet } from "C:\\Users\\maitri.vaghasiya\\GitHub\\trivox-gameplay\\functions\\api\\leaderboard.js"
import { onRequestPost as __api_submit_score_js_onRequestPost } from "C:\\Users\\maitri.vaghasiya\\GitHub\\trivox-gameplay\\functions\\api\\submit-score.js"

export const routes = [
    {
      routePath: "/api/leaderboard",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_leaderboard_js_onRequestGet],
    },
  {
      routePath: "/api/submit-score",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_submit_score_js_onRequestPost],
    },
  ]