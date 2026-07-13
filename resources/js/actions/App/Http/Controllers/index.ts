import HomeController from './HomeController'
import Auth from './Auth'

const Controllers = {
    HomeController: Object.assign(HomeController, HomeController),
    Auth: Object.assign(Auth, Auth),
}

export default Controllers