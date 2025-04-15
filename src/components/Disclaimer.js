import React from "react";
import { Link } from "react-router-dom"; // Import Link for navigation

const Disclaimer = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Disclaimer
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <p className="text-gray-700 mb-4">
            nbastatspro.com does not host, upload, or control any data or
            information. The information and data you see here are shared by
            sports fans worldwide or directly from the nba.com website.
          </p>
          <p className="text-gray-700 mb-6">
            We only act as an intermediary to facilitate your search and will
            not be responsible for any violations or how you use this data.
          </p>

          {/* Vietnamese Version */}
          <hr className="my-6 border-gray-300" />
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Miễn trừ trách nhiệm
          </h3>
          <p className="text-gray-700 mb-4">
            nbastatspro.com không lưu trữ, tải lên hoặc kiểm soát bất kỳ dữ liệu
            hay thông tin nào. Các thông tin và dữ liệu bạn thấy tại đây được
            chia sẻ bởi các fan thể thao trên toàn thế giới hoặc trực tiếp tại
            website nba.com.
          </p>
          <p className="text-gray-700 mb-6">
            Chúng tôi chỉ đóng vai trò trung gian giúp bạn tìm kiếm dễ dàng hơn
            và sẽ không chịu trách nhiệm về bất kì vi phạm nào cũng như việc bạn
            sử dụng các data này ra sao.
          </p>

          <div className="mt-8 text-center">
            {" "}
            {/* Added margin-top */}
            <Link
              to="/"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              &larr; Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;
