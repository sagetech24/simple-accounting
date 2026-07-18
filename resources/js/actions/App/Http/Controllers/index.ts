import Auth from './Auth'
import HomeController from './HomeController'
import Admin from './Admin'

const Controllers = {
    Auth: Object.assign(Auth, Auth),
    HomeController: Object.assign(HomeController, HomeController),
    Admin: Object.assign(Admin, Admin),
}

export default Controllers