import Auth from './Auth'
import HomeController from './HomeController'
import InventoryController from './InventoryController'
import SupplierController from './SupplierController'
import CustomerController from './CustomerController'
import RequestQuotationController from './RequestQuotationController'
import PurchasedOrderController from './PurchasedOrderController'
import AccountsPayableController from './AccountsPayableController'
import BankAccountController from './BankAccountController'
import SettingController from './SettingController'
import Admin from './Admin'

const Controllers = {
    Auth: Object.assign(Auth, Auth),
    HomeController: Object.assign(HomeController, HomeController),
    InventoryController: Object.assign(InventoryController, InventoryController),
    SupplierController: Object.assign(SupplierController, SupplierController),
    CustomerController: Object.assign(CustomerController, CustomerController),
    RequestQuotationController: Object.assign(RequestQuotationController, RequestQuotationController),
    PurchasedOrderController: Object.assign(PurchasedOrderController, PurchasedOrderController),
    AccountsPayableController: Object.assign(AccountsPayableController, AccountsPayableController),
    BankAccountController: Object.assign(BankAccountController, BankAccountController),
    SettingController: Object.assign(SettingController, SettingController),
    Admin: Object.assign(Admin, Admin),
}

export default Controllers