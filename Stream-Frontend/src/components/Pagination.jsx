import {
  AiOutlineFastBackward,
  AiFillFastForward,
  AiOutlineArrowRight,
  AiOutlineArrowLeft,
} from "react-icons/ai";

const range = (start, end) => {
  return [...Array(end - start).keys()].map((el) => el + start);
};

const getPagesCut = ({ pagesCount, pagesCutCount, currentPage }) => {
  const ceiling = Math.ceil(pagesCutCount / 2);
  const floor = Math.floor(pagesCutCount / 2);

  if (pagesCount <= pagesCutCount) {
    return { start: 1, end: pagesCount + 1 };
  } else if (currentPage <= ceiling) {
    return { start: 1, end: pagesCutCount + 1 };
  } else if (currentPage + floor >= pagesCount) {
    return { start: pagesCount - pagesCutCount + 1, end: pagesCount + 1 };
  } else {
    return {
      start: currentPage - ceiling + 1,
      end: currentPage + floor + 1,
    };
  }
};

const PaginationItem = ({ page, currentPage, onPageChange, isDisabled }) => {
  return !isDisabled ? (
    <button
      className={
        page === Number(currentPage)
          ? " border-none flex-grow max-w-fit text-md px-4 py-[0.2rem] bg-otherColor text-bgColor list-none rounded-full transition-all duration-300 ease-in-out hover:bg-secondaryTextColor hover:text-bgColor"
          : " border-none text-secondaryTextColor max-w-fit text-md flex-grow px-4 py-[0.2rem] bg-btnColor list-none rounded-full transition-all duration-300 ease-in-out hover:bg-secondaryTextColor hover:text-bgColor"
      }
      onClick={() => onPageChange(page)}
    >
      <span className="page-link">{page}</span>
    </button>
  ) : (
    <button
      style={{ display: "none" }}
      className={
        page === Number(currentPage)
          ? " border-none flex-grow max-w-[5rem] text-md px-4 py-[0.2rem] bg-otherColor text-bgColor list-none rounded-full transition-all duration-300 ease-in-out hover:bg-secondaryTextColor hover:text-bgColor"
          : " border-none text-secondaryTextColor text-md flex-grow max-w-[5rem] px-4 py-[0.2rem] bg-btnColor list-none rounded-full transition-all duration-300 ease-in-out hover:bg-secondaryTextColor hover:text-bgColor"
      }
      onClick={() => onPageChange(page)}
    >
      <span className="page-link">{page}</span>
    </button>
  );
};

const Pagination = ({ currentPage, total, limit, onPageChange, pagesNum }) => {
  const pagesCount = Math.ceil(total / limit); // Calculate total number of pages
  const pagesCut = getPagesCut({ pagesCount, pagesCutCount: 5, currentPage });
  const pages = range(pagesCut.start, pagesCut.end);

  const isFirstPage = Number(currentPage) === 1;
  const isLastPage = Number(currentPage) === pagesCount;

  return (
    <ul className="flex items-center gap-2 flex-wrap mt-6">
      <PaginationItem
        page={<AiOutlineFastBackward className="text-xl" />}
        currentPage={Number(currentPage)}
        onPageChange={() => onPageChange(1)}
        isDisabled={isFirstPage}
      />
      <PaginationItem
        page={<AiOutlineArrowLeft className="text-xl" />}
        currentPage={Number(currentPage)}
        onPageChange={() => onPageChange(Number(currentPage) - 1)}
        isDisabled={isFirstPage}
      />
      {pages.map((page) => (
        <PaginationItem
          page={page}
          key={page}
          currentPage={Number(currentPage)}
          onPageChange={onPageChange}
        />
      ))}
      <PaginationItem
        page={<AiOutlineArrowRight className="text-xl" />}
        currentPage={Number(currentPage)}
        onPageChange={() => onPageChange(Number(currentPage) + 1)}
        isDisabled={isLastPage}
      />
      <PaginationItem
        page={<AiFillFastForward className="text-xl" />}
        currentPage={Number(currentPage)}
        onPageChange={() => onPageChange(pagesNum)}
        isDisabled={isLastPage}
      />
    </ul>
  );
};

export default Pagination;
