const RepositoryFactory = require('../factories/repositoryFactory');
const bcrypt = require('bcrypt');

class authService {
    constructor() {
        this.userRepository = RepositoryFactory.createUserRepository();
    }

    async register({ nickname, email, password, userType }) {
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error('User already exists');
        }

        const existingNickname = await this.userRepository.findByNickname(nickname);
        if (existingNickname) {
            throw new Error('Nickname already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const validTypes = ['User', 'Author', 'Admin'];
        const finalUserType = validTypes.includes(userType) ? userType : 'User';

        const user = await this.userRepository.create({
            nickname,
            email,
            password_hash: hashedPassword,
            type: finalUserType
        });

        await this.userRepository.createProfileHistory(user.id);

        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async login({ email, password }) {
        const user = await this.userRepository.getUserWithPasswordByEmail(email);

        if (!user || !user.password_hash) {
            throw new Error('Invalid credentials');
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async isAuthor(userId) {
        const user = await this.userRepository.findById(userId);
        return user && (user.type === 'Author' || user.type === 'Admin');
    }

    async isAdmin(userId) {
        const user = await this.userRepository.findById(userId);
        return user && user.type === 'Admin';
    }
}

module.exports = new authService();