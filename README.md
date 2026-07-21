# TerraCheck

AI-powered environmental & planning due-diligence for US real estate. Upload property documents, get a 90-second risk report across 7 data layers (Superfund, RCRA, EPA facilities, USTs, flood zones, wetlands, zoning) with a citation-traceable legal memo.

**Live app:** https://terracheck-667416085341.us-west1.run.app
**Landing page:** https://hughgingell2-collab.github.io/TerraCheck/

## Stack

React 19 + Vite + Tailwind 4 + Leaflet frontend; Express backend running five Gemini pipeline agents (intake → extraction → risk → memo → refine) plus live EPA/FEMA/USFWS registry queries. Deployed on Cloud Run (project `vocal-scion-3fs6l`, region `us-west1`).

## Local development

```sh
npm install
npm run dev        # http://localhost:3000
npm run lint       # type-check
npm run build      # production build
```

Requires a `.env` file (never committed):

```
GEMINI_API_KEY="..."   # from Google Cloud console → API keys
APP_URL="http://localhost:3000"
```

## Deploy

```sh
gcloud run deploy terracheck --source . --region us-west1
```

That's it — builds the Dockerfile with Cloud Build and rolls out a new revision. In production the app reads `GEMINI_API_KEY` from Secret Manager (secret `gemini-api-key`), not from any file. To rotate the key: create a new API key restricted to `generativelanguage.googleapis.com`, then `gcloud secrets versions add gemini-api-key --data-file=-` and redeploy.
