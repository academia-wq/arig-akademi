-- "Санхүу" гэсэн үсгийн алдааг "Санхүү" болгож засна (кодын жагсаалттай таарахын тулд).
update public.modules set category = 'Санхүү' where category = 'Санхүу';
update public.profiles set department = 'Санхүү' where department = 'Санхүу';
