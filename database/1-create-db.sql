CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(70) NOT NULL UNIQUE,
    password_hash VARCHAR(300) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('Admin', 'User', 'Author')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profile_history (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT not null default 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_GrWvA5oKbxeiALyR8O5xG6zkVxgFVFQpQw&s',
    gender VARCHAR(20) DEFAULT 'N/A',
    description VARCHAR(250),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE genre (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE music_entity (
    id SERIAL PRIMARY KEY,
    type VARCHAR(6) NOT NULL CHECK (type IN ('Song', 'EP', 'Album')),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    avatar_url TEXT not null unique,
    entity_url TEXT NOT NULL UNIQUE,
    status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'declined', 'removed')),
    reason VARCHAR(300),
    genre_id INT REFERENCES genre(id) ON DELETE SET NULL,
    views INT NOT NULL DEFAULT 0,
    author_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE song (
    id SERIAL PRIMARY KEY,
    music_entity_id INT NOT NULL UNIQUE REFERENCES music_entity(id) ON DELETE CASCADE
);

CREATE TABLE album (
    id SERIAL PRIMARY KEY,
    music_entity_id INT NOT NULL UNIQUE REFERENCES music_entity(id) ON DELETE CASCADE
);

CREATE TABLE ep (
    id SERIAL PRIMARY KEY,
    music_entity_id INT NOT NULL UNIQUE REFERENCES music_entity(id) ON DELETE CASCADE
);

CREATE TABLE album_tracks (
    id SERIAL PRIMARY KEY,
    album_id INT NOT NULL REFERENCES album(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    url_link TEXT NOT NULL,
    track_order SMALLINT NOT NULL CHECK (track_order > 0),
    UNIQUE(album_id, track_order)
);

CREATE TABLE ep_tracks (
    id SERIAL PRIMARY KEY,
    ep_id INT NOT NULL REFERENCES ep(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    url_link TEXT NOT NULL,
    track_order SMALLINT NOT NULL CHECK (track_order > 0),
    UNIQUE(ep_id, track_order)
);

CREATE OR REPLACE FUNCTION check_album_tracks_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM album_tracks WHERE album_id = NEW.album_id) >= 20 THEN
        RAISE EXCEPTION 'Album cannot have more than 20 tracks';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_ep_tracks_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM ep_tracks WHERE ep_id = NEW.ep_id) > 8 THEN
        RAISE EXCEPTION 'EP cannot have more than 8 tracks';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_album_tracks
    BEFORE INSERT ON album_tracks
    FOR EACH ROW
    EXECUTE FUNCTION check_album_tracks_count();

CREATE TRIGGER trigger_check_ep_tracks
    BEFORE INSERT ON ep_tracks
    FOR EACH ROW
    EXECUTE FUNCTION check_ep_tracks_count();
