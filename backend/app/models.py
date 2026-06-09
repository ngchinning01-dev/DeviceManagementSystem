from datetime import date

from app.extensions import db


class Branch(db.Model):
    __tablename__ = 'branches'

    branch_id = db.Column(db.Integer, primary_key=True)
    branch_name = db.Column(db.String(120), nullable=False)
    location = db.Column(db.String(200))

    devices = db.relationship('Device', back_populates='branch', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'branch_id': self.branch_id,
            'branch_name': self.branch_name,
            'location': self.location,
        }


class User(db.Model):
    __tablename__ = 'users'

    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    department = db.Column(db.String(120))

    devices = db.relationship('Device', back_populates='assigned_user')

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'name': self.name,
            'email': self.email,
            'department': self.department,
        }


class Device(db.Model):
    __tablename__ = 'devices'

    device_id = db.Column(db.Integer, primary_key=True)
    device_name = db.Column(db.String(120), nullable=False)
    device_type = db.Column(db.String(80), nullable=False)
    serial_number = db.Column(db.String(120))
    ip_address = db.Column(db.String(45))
    status = db.Column(db.String(40), nullable=False, default='Active')

    branch_id = db.Column(db.Integer, db.ForeignKey('branches.branch_id'), nullable=False)
    assigned_user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)

    branch = db.relationship('Branch', back_populates='devices')
    assigned_user = db.relationship('User', back_populates='devices')
    maintenance_records = db.relationship(
        'Maintenance', back_populates='device', cascade='all, delete-orphan'
    )

    def to_dict(self):
        return {
            'device_id': self.device_id,
            'device_name': self.device_name,
            'device_type': self.device_type,
            'serial_number': self.serial_number,
            'ip_address': self.ip_address,
            'status': self.status,
            'branch_id': self.branch_id,
            'branch_name': self.branch.branch_name if self.branch else None,
            'assigned_user_id': self.assigned_user_id,
            'assigned_user_name': self.assigned_user.name if self.assigned_user else None,
        }


class Maintenance(db.Model):
    __tablename__ = 'maintenance_records'

    maintenance_id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, db.ForeignKey('devices.device_id'), nullable=False)
    issue = db.Column(db.String(255), nullable=False)
    solution = db.Column(db.String(255))
    date = db.Column(db.Date, nullable=False, default=date.today)

    device = db.relationship('Device', back_populates='maintenance_records')

    def to_dict(self):
        return {
            'maintenance_id': self.maintenance_id,
            'device_id': self.device_id,
            'device_name': self.device.device_name if self.device else None,
            'issue': self.issue,
            'solution': self.solution,
            'date': self.date.isoformat() if self.date else None,
        }
