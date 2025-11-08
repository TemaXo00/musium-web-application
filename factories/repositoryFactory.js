const MusicRepository = require('../repositories/musicRepository');
const UserRepository = require('../repositories/userRepository');
const AuthorRepository = require('../repositories/authorRepository');

class RepositoryFactory {
    static createMusicRepository() {
        return new MusicRepository();
    }

    static createUserRepository() {
        return new UserRepository();
    }

    static createAuthorRepository() {
        return new AuthorRepository();
    }

    static getAllRepositories() {
        return {
            musicRepository: this.createMusicRepository(),
            userRepository: this.createUserRepository(),
            authorRepository: this.createAuthorRepository()
        };
    }

    static getRepository(name) {
        const repositories = this.getAllRepositories();
        return repositories[name] || null;
    }
}

module.exports = RepositoryFactory;