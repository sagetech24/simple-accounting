import HomeController from './HomeController'
import Auth from './Auth'
import Admin from './Admin'

const Controllers = {
    HomeController: Object.assign(HomeController, HomeController),
    Auth: Object.assign(Auth, Auth),
    Admin: Object.assign(Admin, Admin),
}

export default Controllers