import Auth from './Auth'
import HomeController from './HomeController'
import SupplierController from './SupplierController'
import CustomerController from './CustomerController'
import Admin from './Admin'

const Controllers = {
    Auth: Object.assign(Auth, Auth),
    HomeController: Object.assign(HomeController, HomeController),
    SupplierController: Object.assign(SupplierController, SupplierController),
    CustomerController: Object.assign(CustomerController, CustomerController),
    Admin: Object.assign(Admin, Admin),
}

export default Controllers