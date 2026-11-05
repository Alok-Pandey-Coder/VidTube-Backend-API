import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Video } from '../src/models/video.models.js';

export async function createUser(username = 'alok') {
  const _id = new mongoose.Types.ObjectId();
  await mongoose.connection
    .collection('users')
    .insertOne({ _id, username, email: `${username}@test.dev`, fullname: username });
  const token = jwt.sign({ _id: String(_id) }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
  return { _id, token };
}

export const auth = (token) => ({ Authorization: `Bearer ${token}` });

export const makeVideo = (owner, extra = {}) =>
  Video.create({ title: 't', description: 'd', thumbnail: 'http://x/t.png', owner, ...extra });