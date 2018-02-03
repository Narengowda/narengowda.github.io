---
title: Django - Queries - Cheat sheet
undefined: Django quires cheat sheet and complex queires by example
created_date: 2018-01-16 18:30:00 +0000
date: 2018-01-28 01:34:06 +0000
---
 **Queryset** can be constructed, filtered, sliced, and generally passed around without actually hitting the database. No database activity actually occurs until you do something to evaluate the queryset.

Querysets are evaluated when

1. iterated
2. slice
3. pickle
4. repr
5. len
6. list
7. bool

* Filter:Returns a new QuerySet containing objects that match the given lookup parameters.
* Exclude: Returns a new `QuerySet` containing objects that do _not_ match the given lookup parameters. In sql SELECT ...WHERE NOT..
* Annotate

```python
  >>> from django.db.models import Count
  >>> q = Blog.objects.annotate(Count('entry'))
  \# The name of the first blog
  >>> q\[0\].name
  \'Blogasaurus'
  \# The number of entries on the first blog
  >>> q\[0\].entry__count
  42
```

* order_by
* reverse
* distinct

      Entry.objects.order_by('pub_date').distinct('pub_date')
* values

      Blog.objects.values()
      <QuerySet [{'id': 1, 'name': 'Beatles Blog', 'tagline': 'All the latest Beatles news.'}]>
      
      Blog.objects.values('id', 'name')
      <QuerySet [{'id': 1, 'name': 'Beatles Blog'}]>
      
      Blog.objects.values(lower_name=Lower('name'))
      <QuerySet [{'lower_name': 'beatles blog'}]>
* value_list

      >>> Entry.objects.values_list('id', 'headline')
      <QuerySet [(1, 'First entry'), ...]>
      >>> from django.db.models.functions import Lower
      >>> Entry.objects.values_list('id', Lower('headline'))
      <QuerySet [(1, 'first entry'), ...]>
* dates and datetimes

      >>> Entry.objects.dates('pub_date', 'year')
      [datetime.date(2005, 1, 1)]
      >>> Entry.objects.dates('pub_date', 'month')
      [datetime.date(2005, 2, 1), datetime.date(2005, 3, 1)]
      >>> Entry.objects.dates('pub_date', 'day')
      [datetime.date(2005, 2, 20), datetime.date(2005, 3, 20)]
      >>> Entry.objects.dates('pub_date', 'day', order='DESC')
      [datetime.date(2005, 3, 20), datetime.date(2005, 2, 20)]
      >>> Entry.objects.filter(headline__contains='Lennon').dates('pub_date', 'day')
      [datetime.date(2005, 3, 20)]
* all
* union, intersection, difference

      qs1.union(qs2, qs3)
      qs1.intersection(qs2, qs3)
      qs1.difference(qs2, qs3)
* Select_related: Returns a `QuerySet` that will “follow” foreign-key relationships, selecting additional related-object data when it executes its query. This is a performance booster which results in a single more complex query but means later use of foreign-key relationships won’t require database queries

      # Hits the database.
      e = Entry.objects.select_related('blog').get(id=5)
      
      # Doesn't hit the database, because e.blog has been prepopulated
      # in the previous query.
      b = e.blog
* Prefetch related: similar to select_realted

  `select_related` works by creating an SQL join and including the fields of the related object in the `SELECT` statement. For this reason, `select_related` gets the related objects in the same database query. However, to avoid the much larger result set that would result from joining across a ‘many’ relationship, `select_related` is limited to single-valued relationships - foreign key and one-to-one.

  `prefetch_related`, on the other hand, does a separate lookup for each relationship, and does the ‘joining’ in Python. This allows it to prefetch many-to-many and many-to-one objects, which cannot be done using `select_related`, in addition to the foreign key and one-to-one relationships that are supported by `select_related`.

      # This is all possible
      Restaurant.objects.prefetch_related('best_pizza__toppings')
      Restaurant.objects.select_related('best_pizza').prefetch_related('best_pizza__toppings')
* Extra: Sometimes, the Django query syntax by itself can’t easily express a complex `WHERE` clause. For these edge cases, Django provides the `extra()` `QuerySet` modifier — a hook for injecting specific clauses into the SQL generated by a `QuerySet`.

      # Select example
      qs.extra(select={'val': "select col from sometable where othercol = %s"},
               select_params=(someparam,))
      
      # Where example
      Entry.objects.extra(where=["foo='a' OR bar = 'a'", "baz = 'a'"])
      
      # order by
      q = q.extra(order_by = ['-is_recent'])
* Defer: In some complex data-modeling situations, your models might contain a lot of fields, some of which could contain a lot of data (for example, text fields), or require expensive processing to convert them to Python objects. If you are using the results of a queryset in some situation where you don’t know if you need those particular fields when you initially fetch the data, you can tell Django not to retrieve them from the database

      # Simple defer
      Entry.objects.defer("headline", "body")
      
      # complex defer
      Blog.objects.select_related().defer("entry__headline", "entry__body")
* Only: Opposite to defer
* Using: when using multiple databases
* Select___for__u_pda_te: selects rows and locks them for update
* Raw: Takes a raw SQL query, executes it
* Get
* Create
* update
* delete
* get _or create and update or create_
* bulk_create
* count
* in_bulk: to get multiple entries in bulk
* **OuterRef:** Use `OuterRef` when a queryset in a `Subquery` needs to refer to a field from the outer query. It acts like an `[F](https://docs.djangoproject.com/en/2.0/ref/models/expressions/#django.db.models.F "django.db.models.F")` expression except that the check to see if it refers to a valid field isn’t made until the outer queryset is resolved.
* Latest

      Entry.objects.latest('pub_date', '-expire_date')
* first and last
* Aggregate:

       Book.objects.aggregate(Avg('price'), Max('price'), Min('price'))
* Annotate

      q = Book.objects.annotate(Count('authors'))
      # Interrogate the first object in the queryset
      >>> q[0]
      <Book: The Definitive Guide to Django>
      >>> q[0].authors__count
      2
      # Interrogate the second object in the queryset
      >>> q[1]
      <Book: Practical Django Projects>
      >>> q[1].authors__count
      1
* Follow relationships backwards ( how we use `'book'` to specify the `Publisher` -> `Book` reverse foreign key hop))

      Publisher.objects.aggregate(oldest_pubdate=Min('book__pubdate'))
* Filter on annotation

      Book.objects.annotate(num_authors=Count('authors')).filter(num_authors__gt=1)
* Q objects (Logical operations)

      Q(question__startswith='Who') | Q(question__startswith='What')
      Poll.objects.get(
          Q(question__startswith='Who'),
          Q(pub_date=date(2005, 5, 2)) | Q(pub_date=date(2005, 5, 6))
      )
* F expressions: act as a reference to a model field within a query

      >>> from django.db.models import F
      >>> Entry.objects.filter(n_comments__gt=F('n_pingbacks'))
* `Subquery()` expressions

      >>> from django.db.models import OuterRef, Subquery
      >>> newest = Comment.objects.filter(post=OuterRef('pk')).order_by('-created_at')
      >>> Post.objects.annotate(newest_commenter_email=Subquery(newest.values('email')[:1]))

##### Learn COMPLEX queries by examples:

    # Group by date
    Log.objects.order_by().annotate(date=TruncDate('created_at')).values('date').annotate(c=Count('id'))
    
    # Annotating Django querysets with ForeignKey Counts subject to conditions
    
    Airport.objects.filter(
        Q(origins__owner=user) | Q(destinations__owner=user)
    ).annotate(
        num_origins=Count(
            Case(When(Q(origin__owner=user), then=1, else=0)),
        ),
        num_destinations=Count(
            Case(When(Q(destination__owner=user), then=1, else=0)),
        )
    )
    
    # Aggrigate	
    Feedback.objects.aggregate(avg_rating=Avg('rating'))
    
    Parent.objects
    .annotate(child_count=Count('child'))
    .annotate(
        grandchild_count_for_state_true=Subquery(
            GrandChild.objects.filter(
                state=True,
                child=OuterRef('pk')
            ).values('parent')
            .annotate(cnt=Sum('child__grandchild__num'))
            .values('cnt'),
            num=models.IntegerField()
        )
    )

WINDOW: Window functions provide a way to apply functions on partitions. Unlike a normal aggregation function which computes a final result for each set defined by the group by, window functions operate on [frames](https://docs.djangoproject.com/en/2.0/ref/models/expressions/#window-frames) and partitions, and compute the result for each row.

    >>> from django.db.models import Avg, F, RowRange, Window
    >>> from django.db.models.functions import ExtractYear
    >>> Movie.objects.annotate(
    >>>     avg_rating=Window(
    >>>         expression=Avg('rating'),
    >>>         partition_by=[F('studio'), F('genre')],
    >>>         order_by=ExtractYear('released').asc(),
    >>>         frame=RowRange(start=-2, end=2),
    >>>     ),
    >>> )

`**Exists:**`is a `Subquery` subclass that uses an SQL `EXISTS` statement. In many cases it will perform better than a subquery since the database is able to stop evaluation of the subquery when a first matching row is found.

For example, to annotate each post with whether or not it has a comment from within the last day:

    >>> from django.db.models import Exists, OuterRef
    >>> from datetime import timedelta
    >>> from django.utils import timezone
    >>> one_day_ago = timezone.now() - timedelta(days=1)
    >>> recent_comments = Comment.objects.filter(
    ...     post=OuterRef('pk'),
    ...     created_at__gte=one_day_ago,
    ... )
    >>> Post.objects.annotate(recent_comment=Exists(recent_comments))

`Exists` is a `Subquery` subclass that uses an SQL `EXISTS` statement. In many cases it will perform better than a subquery since the database is able to stop evaluation of the subquery when a first matching row is found.

For example, to annotate each post with whether or not it has a comment from within the last day:

    >>> from django.db.models import Exists, OuterRef
    >>> from datetime import timedelta
    >>> from django.utils import timezone
    >>> one_day_ago = timezone.now() - timedelta(days=1)
    >>> recent_comments = Comment.objects.filter(
    ...     post=OuterRef('pk'),
    ...     created_at__gte=one_day_ago,
    ... )
    >>> Post.objects.annotate(recent_comment=Exists(recent_comments))
    

more examples

    from django.db.models.functions import Concat
    from django.db.models import F, Value
    
    qs = qs.annotate(fullname=Concat(F('name'), Value(' '), F('surname')))\
                .filter(fullname__icontains=textquery)

If you want to write django queries try answering these questions in django ORM

[http://a4academics.com/interview-questions/53-database-and-sql/397-top-100-database-sql-interview-questions-and-answers-examples-queries?showall=&start=2](http://a4academics.com/interview-questions/53-database-and-sql/397-top-100-database-sql-interview-questions-and-answers-examples-queries?showall=&start=2 "http://a4academics.com/interview-questions/53-database-and-sql/397-top-100-database-sql-interview-questions-and-answers-examples-queries?showall=&start=2")

References:

Django documentaion

[https://stackoverflow.com/questions/8746014/django-group-by-date-day-month-year](https://stackoverflow.com/questions/8746014/django-group-by-date-day-month-year "https://stackoverflow.com/questions/8746014/django-group-by-date-day-month-year")

[https://stackoverflow.com/questions/48301339/group-by-each-date-in-django-2](https://stackoverflow.com/questions/48301339/group-by-each-date-in-django-2 "https://stackoverflow.com/questions/48301339/group-by-each-date-in-django-2")

[https://stackoverflow.com/questions/tagged/django-queryset](https://stackoverflow.com/questions/tagged/django-queryset "https://stackoverflow.com/questions/tagged/django-queryset")