import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import User, UserRole
from apps.offices.models import Office, NetworkPolicy, VerificationMode
from apps.employees.models import Department, EmployeeProfile, EmploymentStatus
from apps.shifts.models import Shift, EmployeeShiftAssignment

class Command(BaseCommand):
    help = 'Bootstraps system with default office, network policy, shifts, departments, and seed users.'

    def add_arguments(self, parser):
        parser.add_argument('--admin-email', type=str, default='admin@company.com')
        parser.add_argument('--admin-password', type=str, default='AdminPassword123!')
        parser.add_argument('--office-ip', type=str, default='223.236.99.39')

    def handle(self, *args, **options):
        admin_email = options['admin_email']
        admin_password = options['admin_password']
        office_ip = options['office_ip']

        self.stdout.write(self.style.NOTICE("Starting system bootstrap..."))

        # 1. Office & Network Policy
        office, created = Office.objects.get_or_create(
            name="Headquarters",
            defaults={
                'timezone': 'Asia/Kolkata',
                'address': 'Corporate Hub, Level 4, Tech City',
                'is_active': True
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created primary office: {office.name}"))

        policy, p_created = NetworkPolicy.objects.get_or_create(
            office=office,
            defaults={
                'verification_mode': VerificationMode.STRICT_IP_ALLOWLIST,
                'allowed_ip_ranges': [f"{office_ip}/32", "127.0.0.1/32"],
                'strict_mode_enabled': True,
                'is_active': True
            }
        )
        if p_created:
            self.stdout.write(self.style.SUCCESS(f"Created network policy with allowed IP: {office_ip} and loopback"))

        # 2. Departments
        dept_names = ["Engineering", "Human Resources", "Operations", "Finance"]
        departments = {}
        for dname in dept_names:
            dept, _ = Department.objects.get_or_create(name=dname)
            departments[dname] = dept
        self.stdout.write(self.style.SUCCESS(f"Departments initialized: {', '.join(dept_names)}"))

        # 3. Shifts
        gen_shift, _ = Shift.objects.get_or_create(
            name="General Shift",
            defaults={
                'start_time': datetime.time(9, 30),
                'end_time': datetime.time(18, 30),
                'grace_minutes': 15,
                'minimum_work_minutes': 480,
                'weekly_off_days': [5, 6],
                'is_active': True
            }
        )
        morning_shift, _ = Shift.objects.get_or_create(
            name="Morning Shift",
            defaults={
                'start_time': datetime.time(8, 0),
                'end_time': datetime.time(17, 0),
                'grace_minutes': 15,
                'minimum_work_minutes': 480,
                'weekly_off_days': [5, 6],
                'is_active': True
            }
        )
        self.stdout.write(self.style.SUCCESS("Standard shifts initialized"))

        # 4. Super Admin User
        admin_user = User.objects.filter(email=admin_email).first()
        if not admin_user:
            admin_user = User.objects.create_superuser(
                email=admin_email,
                password=admin_password,
                role=UserRole.SUPER_ADMIN
            )
            EmployeeProfile.objects.create(
                user=admin_user,
                employee_code='ADM-001',
                first_name='Super',
                last_name='Admin',
                phone='+91 9876543210',
                department=departments['Engineering'],
                office=office,
                designation='System Architect',
                joining_date=timezone.now().date(),
                employment_status=EmploymentStatus.ACTIVE
            )
            self.stdout.write(self.style.SUCCESS(f"Super Admin created: {admin_email} (pwd: {admin_password})"))
        else:
            self.stdout.write(self.style.NOTICE(f"Super Admin already exists: {admin_email}"))

        # 5. HR Admin User
        hr_email = 'hr@company.com'
        hr_password = 'HrPassword123!'
        hr_user = User.objects.filter(email=hr_email).first()
        if not hr_user:
            hr_user = User.objects.create_user(
                email=hr_email,
                password=hr_password,
                role=UserRole.HR_ADMIN
            )
            EmployeeProfile.objects.create(
                user=hr_user,
                employee_code='HR-001',
                first_name='Sarah',
                last_name='Jenkins',
                phone='+91 9876543211',
                department=departments['Human Resources'],
                office=office,
                designation='HR Manager',
                joining_date=timezone.now().date(),
                employment_status=EmploymentStatus.ACTIVE
            )
            self.stdout.write(self.style.SUCCESS(f"HR Admin created: {hr_email} (pwd: {hr_password})"))

        # 6. Employee User
        emp_email = 'employee@company.com'
        emp_password = 'EmpPassword123!'
        emp_user = User.objects.filter(email=emp_email).first()
        if not emp_user:
            emp_user = User.objects.create_user(
                email=emp_email,
                password=emp_password,
                role=UserRole.EMPLOYEE
            )
            emp_profile = EmployeeProfile.objects.create(
                user=emp_user,
                employee_code='EMP-1001',
                first_name='Alex',
                last_name='Rivera',
                phone='+91 9876543212',
                department=departments['Engineering'],
                office=office,
                designation='Frontend Engineer',
                joining_date=timezone.now().date(),
                employment_status=EmploymentStatus.ACTIVE
            )
            EmployeeShiftAssignment.objects.create(
                employee=emp_profile,
                shift=gen_shift,
                effective_from=timezone.now().date(),
                is_active=True
            )
            self.stdout.write(self.style.SUCCESS(f"Sample Employee created: {emp_email} (pwd: {emp_password})"))

        self.stdout.write(self.style.SUCCESS("Bootstrap completed successfully!"))
