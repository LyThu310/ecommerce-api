const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({
  adapter
});

// =========================
// REGISTER
// =========================
const register = async (req, res) => {
  try {
    const { username, fullname, password } = req.body;

    // 1. Kiểm tra dữ liệu đầu vào
    if (!username || !fullname || !password) {
      return res.status(400).json({
        message: "Username, fullname and password are required"
      });
    }

    // 2. Kiểm tra username đã tồn tại chưa
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username
      }
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username already exists"
      });
    }

    // 3. Tìm role mặc định = normal
    const normalRole = await prisma.role.findFirst({
      where: {
        rolename: "normal"
      }
    });

    // 4. Tìm membership mặc định = BRONZE
    const bronzeMembership = await prisma.memberShip.findFirst({
      where: {
        mname: "BRONZE"
      }
    });

    if (!normalRole || !bronzeMembership) {
      return res.status(500).json({
        message: "Default Role or MemberShip not found"
      });
    }

    // 5. Hash password bằng bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Tạo User mới
    const newUser = await prisma.user.create({
      data: {
        username: username,
        fullname: fullname,
        password: hashedPassword,
        roleid: normalRole.roleid,
        mid: bronzeMembership.mid
      },
      select: {
        uid: true,
        username: true,
        fullname: true,
        role: {
          select: {
            rolename: true
          }
        },
        membership: {
          select: {
            score: true
          }
        }
      }
    });

    // 7. Trả kết quả
    return res.status(201).json({
      message: "Register successfully",
      user: {
        uid: newUser.uid,
        username: newUser.username,
        fullname: newUser.fullname,
        role: newUser.role.rolename,
        score: newUser.membership.score
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// =========================
// LOGIN
// =========================
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Kiểm tra dữ liệu đầu vào
    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    // 2. Tìm user
    const user = await prisma.user.findFirst({
      where: {
        username: username
      }
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    // 3. So sánh password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    // 4. Tạo JWT
    const token = jwt.sign(
      {
        uid: user.uid,
        username: user.username,
        roleid: user.roleid
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN
      }
    );

    // 5. Trả token
    return res.status(200).json({
      message: "Login successfully",
      token: token
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports = {
  register,
  login
};