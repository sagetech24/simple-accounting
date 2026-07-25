import Auth from './Auth'
import HomeController from './HomeController'
import SupplierController from './SupplierController'
import CustomerController from './CustomerController'
import RequestQuotationController from './RequestQuotationController'
import Admin from './Admin'

const Controllers = {
    Auth: Object.assign(Auth, Auth),
    HomeController: Object.assign(HomeController, HomeController),
    SupplierController: Object.assign(SupplierController, SupplierController),
    CustomerController: Object.assign(CustomerController, CustomerController),
    RequestQuotationController: Object.assign(RequestQuotationController, RequestQuotationController),
    Admin: Object.assign(Admin, Admin),
}

export default Controllers