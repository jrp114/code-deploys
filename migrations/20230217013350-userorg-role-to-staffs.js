const mongoose = require('mongoose');

module.exports = {
  async up(db, client) {
    const findAll = async() => {
      return db.collection('userorganizations').find().toArray();
    }
    const findAllStaffs = async () => {
      return db.collection('staffs').find().toArray();
    }

    const userorgs = await findAll()
    const staffs = await findAllStaffs()
    for (const uo of userorgs) {
      const staff = staffs.find(s => s.userOrganization && uo._id && s.userOrganization.toString() === uo._id.toString())
      if (staff) {
        await db.collection('staffs').updateOne({ _id: staff._id }, { $set: { role: uo.role } })
      } else {
        await db.collection('staffs').insertOne({
          userOrganization: mongoose.Types.ObjectId(uo._id),
          joining: { month: uo.createdAt.getMonth(), year: uo.createdAt.getFullYear() },
          role: uo.role,
        })
      }
    }
  },

  async down(db, client) {
    await db.collection('staffs').updateMany({}, { $unset: { role: 1 } }, { multi: true })
  }
};
