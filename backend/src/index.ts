import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router } from './routes';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: '*',
  }),
);

app.use(express.json());

app.use('/api', router);

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Nefertiti backend running on port ${PORT}`);
});

export default app;
