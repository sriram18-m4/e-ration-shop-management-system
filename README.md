# E-Ration Shop Management System

A production-minded full-stack system for digitized ration distribution, stock tracking, beneficiary management, and transparent transaction logs.

## Architecture

e-ration-shop-management-system/
  backend/             Express REST API, JWT auth, RBAC, MySQL access
  frontend/            React + Vite app for admins, shop owners, beneficiaries
  backend/database/    MySQL schema and seed data

The backend is organized by feature modules with controllers, services, validation, and routes separated. Stock distribution uses MySQL transactions and row locking so stock deductions and transaction logs succeed or fail together.

## Roles

- admin: manages users, shops, beneficiaries, and the ration item catalog; monitors all stock and transactions without issuing ration or changing shop quantities.
- shop_owner: manages assigned shop stock, beneficiaries, and ration issue transactions.
- beneficiary: views own dashboard, ration profile, and transaction history.

## Credentials

- admin-> maild id: admin@eration.local, password:Password@123
- shop_owner-> mail id: owner.central@eration.local, password:Password@123
- beneficiary-> mail id: beneficiary@eration.local, password:Password@123
