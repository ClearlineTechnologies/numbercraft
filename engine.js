/* Numbercraft: original mathematical content and constrained procedural generators. */
(function(root){
'use strict';
const ri=(r,a,b)=>Math.floor(r()*(b-a+1))+a;
const pick=(r,a)=>a[ri(r,0,a.length-1)];
const round=(n,p=2)=>Math.round((n+Number.EPSILON)*10**p)/10**p;
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const frac=(a,b)=>{const g=gcd(a,b);return b/g===1?String(a/g):(a/g)+'/'+(b/g);};
const fmt=n=>Number.isInteger(n)?String(n):String(round(n,4));
const sign=n=>n<0?'− '+(-n):'+ '+n;
const definitions=[
['count','arithmetic',0,'Numbers & quantities','A number tells you how many things are in a group. Zero means none.','Count each object once. The last number is the total.','Three dots: ● ● ●. The quantity is 3.'],
['add','arithmetic',0,'Addition','Addition joins quantities. The + sign means add.','Start at the first number and move forward by the second number.','2 + 3 = 5. Two objects and three more make five.'],
['subtract','arithmetic',0,'Subtraction','Subtraction takes a quantity away. The − sign means subtract.','Begin with the total. Remove the second quantity.','5 − 2 = 3: five objects with two removed leaves three.'],
['place','arithmetic',0,'Place value','A digit has a value determined by its position: ones, tens, hundreds, thousands.','Multiply a digit by its place value.','In 352, the digit 5 means 50: five tens.'],
['groups','arithmetic',0,'Equal groups','Multiplication combines groups of equal size. The × sign means multiply.','Number of groups × number per group = total.','3 × 2 = 6: three groups of two.'],
['tables','arithmetic',1,'Multiplication recall','Recall grows when you revisit small facts on different days. You do not need to recount forever.','Learn a few facts, use them, then revisit them. Reversing factors gives the same product.','8 × 7 = 56. Rebuild it as 8 × 5 + 8 × 2 = 40 + 16.'],
['division','arithmetic',1,'Division','Division shares a total equally. The ÷ sign means divide.','Reverse multiplication: if 4 × 3 = 12, then 12 ÷ 4 = 3.','20 ÷ 5 = 4. Twenty shared into five equal groups gives four each.'],
['remainder','arithmetic',1,'Remainders','A remainder is what is left after forming as many full groups as possible.','Dividend = divisor × quotient + remainder. The remainder is less than the divisor.','17 ÷ 5 makes three full groups, with remainder 2.'],
['order','arithmetic',1,'Order of operations','The order in which operations are performed changes the answer.','Brackets; powers; multiplication/division left to right; addition/subtraction left to right.','3 + 4 × 2 = 11. Multiply 4 by 2 before adding 3.'],
['integers','arithmetic',1,'Negative numbers','Negative numbers are below zero, like temperatures below zero or a debt.','Adding a negative moves left. Subtracting a negative moves right.','−3 + 5 = 2. Also, 4 − (−2) = 6.'],
['fraction-part','arithmetic',2,'Fractions of a quantity','A denominator counts equal parts in the whole. A numerator counts selected parts.','To find a/b of a quantity, divide by b and multiply by a.','3/4 of 20 = 20 ÷ 4 × 3 = 15.'],
['fraction-add','arithmetic',2,'Adding fractions','Fractions need equal-sized parts before adding their numerators.','Use a common denominator. Multiply numerator and denominator by the same factor.','1/2 + 1/3 = 3/6 + 2/6 = 5/6.'],
['fraction-multiply','arithmetic',2,'Multiplying fractions','Multiplying fractions finds a fraction of a fraction.','Multiply top numbers together and bottom numbers together.','2/3 × 3/5 = 6/15 = 2/5.'],
['decimals','arithmetic',2,'Decimals','Positions after the decimal point represent tenths, hundredths and smaller parts.','Align decimal points to add equal place values.','1.25 + 0.40 = 1.65.'],
['percent','arithmetic',2,'Percentages','Percent means out of one hundred. 25% is 25/100 or one quarter.','p% of n = p × n ÷ 100.','20% of 60 = 20 × 60 ÷ 100 = 12.'],
['ratio','arithmetic',2,'Ratios & rates','A ratio compares quantities. A unit rate is the amount corresponding to one unit.','Divide to find the value for one item, then multiply by the number of items.','If 3 notebooks cost 12 coins, five cost 12 ÷ 3 × 5 = 20.'],
['powers','arithmetic',3,'Powers & square roots','A power is repeated multiplication. A square root reverses squaring.','a^n means n copies of a multiplied. √n asks for the nonnegative number whose square is n.','3^3 = 27; √49 = 7.'],
['averages','arithmetic',3,'Mean & median','The mean shares a total equally. The median is the middle value after sorting.','Mean = sum ÷ count. With an odd count, the median is the middle sorted value.','For 2, 4, 9: mean = 5; median = 4.'],
['variables','algebra',0,'Variables & substitution','A variable is a letter representing a number. Substitution replaces it with a known value.','Replace each x with its value. 3x means 3 × x.','For x = 4, 3x + 2 = 14.'],
['one-step','algebra',0,'One-step equations','An equation says two expressions are equal. Solve it by finding the missing value.','Do the same operation to both sides to preserve equality.','x + 5 = 12 → subtract 5 from both sides → x = 7.'],
['two-step','algebra',0,'Two-step equations','Undo the operations around the variable in reverse order.','Undo addition first, then multiplication.','3x + 2 = 17 → 3x = 15 → x = 5.'],
['both-sides','algebra',1,'Variables on both sides','Collect variable terms and constants while preserving equality.','Subtract a variable term from both sides, then solve.','5x + 2 = 2x + 14 → 3x = 12 → x = 4.'],
['expand','algebra',1,'Expand & collect','Distribute multiplication to every term inside brackets. Like terms contain the same variable power.','a(bx+c) = abx+ac. A coefficient is the number multiplying a variable.','3(2x+4)+5x = 11x+12. The coefficient of x is 11.'],
['linear','algebra',1,'Linear functions','A linear function forms a straight line. Its slope is the change in y for one step in x.','y = mx+b: m is the slope, b is the value when x=0.','y = 2x+3 gives y=11 when x=4.'],
['inequality','algebra',1,'Inequalities','Inequalities use <, >, ≤ or ≥ to compare values.','Solve like an equation. Reverse the sign if multiplying or dividing by a negative.','2x+1 ≤ 9 gives x ≤ 4. The largest allowed integer is 4.'],
['systems','algebra',2,'Simultaneous equations','A solution must satisfy both equations.','Subtract or add equations to eliminate a variable.','x+y=9 and 2x+y=13 → subtract the first → x=4.'],
['quadratics','algebra',2,'Quadratic equations','Quadratics contain x². Factoring can reveal their roots.','(x−p)(x−q)=0 gives roots p and q. The expanded form is x²−(p+q)x+pq.','x²−7x+12 = (x−3)(x−4), so the larger root is 4.'],
['exponents','algebra',2,'Exponent laws','Powers with a common base follow consistent rules.','x^a × x^b = x^(a+b); x^a ÷ x^b = x^(a−b), x≠0; (x^a)^b = x^(ab).','x^3 × x^5 = x^8.'],
['logs','algebra',2,'Logarithms','A logarithm asks which exponent gives a number from a base.','log_b(N)=k means b^k=N, with b>0 and b≠1.','log_2(32)=5 because 2^5=32.'],
['sequences','algebra',2,'Sequences','Arithmetic sequences add a fixed difference. Geometric sequences multiply by a fixed ratio.','Arithmetic term n: a+(n−1)d. Geometric term n: a×r^(n−1).','3,7,11,… has fifth term 3+4×4=19.'],
['composition','algebra',3,'Function composition','Composition feeds the output of one function into another.','f(g(x)) means evaluate g first, then f.','f(x)=2x+1, g(x)=x² gives f(g(3))=f(9)=19.'],
['combinations','algebra',3,'Combinatorics','Combinations count selections where order does not matter.','Choosing two from n gives n(n−1)/2. Divide by 2 because each pair was counted in both orders.','There are 5×4÷2=10 pairs among 5 people.'],
['probability','algebra',3,'Probability','Probability is between 0 (impossible) and 1 (certain).','With equally likely outcomes: favourable outcomes ÷ all outcomes.','3 red and 2 blue tokens gives P(red)=3/5.'],
['determinants','algebra',3,'Matrices & determinants','A matrix is a rectangular array. A determinant is a number associated with a square matrix.','For [[a,b],[c,d]], determinant = ad−bc. If zero, the matrix is not invertible.','[[2,3],[1,4]] has determinant 8−3=5.'],
['derivatives','algebra',3,'Differential calculus','A derivative measures instantaneous rate of change, the slope at a point.','If f(x)=ax^n, then f′(x)=anx^(n−1). A constant has derivative 0.','f(x)=3x²+5 gives f′(x)=6x and f′(2)=12.'],
['integrals','algebra',3,'Integral calculus','A definite integral accumulates signed area between two bounds.','An antiderivative of ax^n is ax^(n+1)/(n+1). Evaluate upper bound minus lower bound.','∫ from 0 to 3 of 2x dx = [x²] from 0 to 3 = 9.'],
['limits','algebra',3,'Limits','A limit is the value approached as an input approaches a point. The function need not be defined at that point.','For a removable 0/0 form, factor and cancel for nearby x before evaluating the limit.','lim x→3 of (x²−9)/(x−3) = lim x→3 of x+3 = 6.'],
['eigenvalues','algebra',3,'Eigenvalues','An eigenvector keeps its direction under a matrix transformation. Its eigenvalue is the scale factor.','The eigenvalues of a triangular matrix are its diagonal entries. Their sum is the trace.','[[2,5],[0,7]] has eigenvalues 2 and 7, with sum 9.'],
['shapes','geometry',0,'Meet the shapes','Geometry studies shapes and space. A side is a straight edge; a corner is where sides meet.','Triangle: 3 sides. Quadrilateral: 4. Pentagon: 5. Hexagon: 6. A circle has no straight sides.','A square has 4 equal sides and 4 corners. A triangle has 3 of each.'],
['perimeter','geometry',0,'Perimeter','Perimeter is the distance all the way around a shape.','For a rectangle: P=2×length+2×width.','A rectangle 5 long and 3 wide has perimeter 5+3+5+3=16.'],
['area','geometry',0,'Rectangle area','Area measures the space inside a flat shape in square units.','Rectangle area = length × width.','A 4 by 3 rectangle covers 12 square units.'],
['angles','geometry',0,'Angles','An angle measures a turn in degrees (°). A full turn is 360°, a straight line 180°, a right angle 90°.','Adjacent angles on a straight line total 180°.','An angle of 65° beside another on a straight line leaves 115°.'],
['triangle-area','geometry',1,'Triangle area','A triangle’s height is perpendicular to its base, meeting the base line at 90°.','Area = base × perpendicular height ÷ 2.','Base 8, height 3 → area 12 square units.'],
['triangle-angles','geometry',1,'Triangle angles','In a flat plane, a triangle’s three interior angles add to 180°.','Missing angle = 180° − the other two angles.','Angles 50° and 60° leave a third angle of 70°.'],
['polygons','geometry',1,'Polygon angles','A polygon is a closed flat shape with straight sides.','The interior-angle sum for n sides is (n−2)×180°.','A pentagon has (5−2)×180=540° in total.'],
['circumference','geometry',1,'Circle circumference','Radius is centre-to-edge distance. Diameter is twice the radius. Circumference is distance around the circle.','C=2πr. π is about 3.14159. When asked for k in kπ, enter only the coefficient.','Radius 3 gives circumference 6π: k=6.'],
['circle-area','geometry',1,'Circle area','Circle area measures the flat region inside a circle.','A=πr². When asked for k in kπ, enter the number multiplying π.','Radius 4 gives area 16π: k=16.'],
['volume','geometry',1,'Volume','Volume measures space inside a 3D object in cubic units.','For a rectangular box: length × width × height.','A 2 by 3 by 4 box has volume 24 cubic units.'],
['cylinder','geometry',2,'Cylinders','A cylinder has equal circular ends. Its volume is base area times height.','V=πr²h.','Radius 2 and height 5 give volume 20π.'],
['pythagoras','geometry',2,'Right triangles','A right triangle has a 90° angle. Its longest side, the hypotenuse, lies opposite this angle.','a²+b²=c², where c is the hypotenuse.','Legs 3 and 4 give c²=25, so c=5.'],
['distance','geometry',2,'Coordinate distance','Coordinates (x,y) locate a point: horizontally, then vertically.','Squared distance = (x₂−x₁)²+(y₂−y₁)². Distance is its square root.','Between (1,2) and (4,6), squared distance is 3²+4²=25.'],
['slope','geometry',2,'Slope of a line','Slope tells you how steeply a line rises or falls.','Slope = change in y ÷ change in x. Vertical lines have undefined slope.','From (1,2) to (3,8): slope=(8−2)/(3−1)=3.'],
['similarity','geometry',2,'Similar shapes','Similar shapes have equal corresponding angles and proportional sides.','Scaling lengths by k scales area by k² and volume by k³.','Tripling every side makes area 9 times larger.'],
['trig','geometry',2,'Trigonometric ratios','Sine, cosine and tangent compare sides of a right triangle relative to one acute angle.','sin=opposite/hypotenuse; cos=adjacent/hypotenuse; tan=opposite/adjacent.','Opposite 3, adjacent 4, hypotenuse 5 gives sin θ=3/5.'],
['cosine','geometry',3,'Law of cosines','The cosine rule extends Pythagoras to non-right triangles.','c²=a²+b²−2ab cos C, where C is the angle between a and b.','For a=3, b=4, C=60°, c²=9+16−12=13.'],
['dot','geometry',3,'Vector dot product','A vector has magnitude and direction. A dot product gives a scalar number.','(a,b)·(c,d)=ac+bd. A zero result means nonzero vectors are perpendicular.','(2,3)·(4,−1)=8−3=5.'],
['cross','geometry',3,'Vector cross product','In 3D, the cross product produces a vector perpendicular to both original vectors. Order matters.','The z component of u×v is uₓvᵧ−uᵧvₓ.','u=(2,3,1), v=(4,5,2) gives z component 10−12=−2.'],
['planes','geometry',3,'Planes in 3D','A plane is a flat surface extending through three-dimensional space.','In ax+by+cz=d, substitute known coordinates and solve for the unknown.','2x+3y+z=12 at x=1,y=2 gives z=4.'],
['conics','geometry',3,'Conic sections','Parabolas, ellipses and hyperbolas are conic sections. Points on a parabola are equally distant from its focus and directrix.','For y²=4px, focus=(p,0) and directrix is x=−p.','y²=12x gives p=3 and focus (3,0).'],
['polar','geometry',3,'Polar coordinates','Polar coordinates give distance r from the origin and an angle from the positive x axis.','x=r cos θ; y=r sin θ. Angles here are in degrees.','r=10, θ=60° gives x=10×1/2=5.'],
['curvature','geometry',3,'Curvature','Curvature measures how sharply a smooth curve bends at a point. It uses first and second derivatives.','κ=|f″(x)|/(1+f′(x)²)^(3/2).','For y=3x² at x=0: f′=0, f″=6, so κ=6.']
];
const courses=definitions.map(([id,track,tier,title,about,rule,example])=>({id,track,tier,title,about,rule,example}));
const tracks={arithmetic:{title:'Arithmetic',subtitle:'Make numbers second nature.',color:'amber'},algebra:{title:'Algebra',subtitle:'Give the unknown a name.',color:'blue'},geometry:{title:'Geometry',subtitle:'See the mathematics around you.',color:'violet'}};
const tiers=['Foundations','Build connections','Solve & apply','Higher mathematics'];
function seeded(seed){let t=seed>>>0;return()=>{t+=0x6D2B79F5;let v=Math.imul(t^t>>>15,1|t);v^=v+Math.imul(v^v>>>7,61|v);return((v^v>>>14)>>>0)/4294967296;};}
function generate(id,d=0,r=Math.random){
 d=Math.max(0,Math.min(2,d));let a,b,c,e,x,y,n,k,p,z,ans,stem,steps,hint,visual,exact;
 const I=(lo,hi)=>ri(r,lo,hi),P=v=>pick(r,v);
 switch(id){
 case 'count':a=I(0,5+d*5);stem='How many dots are here?';ans=a;steps=['Count each dot once.','The quantity is '+a+'.'];hint='Point to each dot once. Zero means none.';visual={kind:'dots',a};break;
 case 'add':a=I(0,5+d*10);b=I(0,5+d*10);stem=a+' + '+b;ans=a+b;steps=['Start with '+a+'. Add '+b+' more.',stem+' = '+ans+'.'];hint='Start at '+a+' and count forward '+b+' steps.';visual={kind:'join',a,b};break;
 case 'subtract':a=I(1,8+d*15);b=I(0,a);stem=a+' − '+b;ans=a-b;steps=['Begin with '+a+' and remove '+b+'.',stem+' = '+ans+'.'];hint='Count back '+b+' steps from '+a+'.';visual={kind:'remove',a,b};break;
 case 'place':n=I(10,d?9999:99);p=P([1,10,100,1000].filter(v=>v<=n));a=Math.floor(n/p)%10;stem='In '+n+', what is the value in the '+({1:'ones',10:'tens',100:'hundreds',1000:'thousands'}[p])+' place?';ans=a*p;steps=['That digit is '+a+'.',a+' × '+p+' = '+ans+'.'];hint='The digit times the place value.';break;
 case 'groups':a=I(1,3+d);b=I(1,3+d);stem=a+' groups of '+b+'. How many altogether?';ans=a*b;steps=[Array(a).fill(b).join(' + ')+' = '+ans+'.',a+' × '+b+' = '+ans+'.'];hint='Each group has '+b+' objects.';visual={kind:'groups',a,b};break;
 case 'tables':a=d===0?P([2,5,10]):I(2,d===1?9:12);b=I(1,d===2?12:10);stem=a+' × '+b;ans=a*b;steps=[stem+' = '+ans+'.',b>5?'Split it: '+a+' × 5 + '+a+' × '+(b-5)+' = '+(a*5)+' + '+a*(b-5)+'.':'Think of '+b+' groups of '+a+'.'];hint=b>5?'Split '+b+' into 5 + '+(b-5)+'. Multiply the parts, then add.':'Use a known neighbour, doubling, or equal groups.';break;
 case 'division':a=I(1,5+d*4);b=I(1,5+d*4);stem=a*b+' ÷ '+b;ans=a;steps=[b+' × '+a+' = '+a*b+'.',stem+' = '+a+'.'];hint=b+' × ? = '+a*b+'.';break;
 case 'remainder':b=I(2,6+d*5);a=I(1,8+d*8);ans=I(0,b-1);n=a*b+ans;stem='What is the remainder when '+n+' is divided by '+b+'?';steps=[b+' × '+a+' = '+a*b+'.',n+' − '+a*b+' = '+ans+'.'];hint='Find the largest multiple of '+b+' not greater than '+n+'.';break;
 case 'order':a=I(1,9+d*9);b=I(1,8);c=I(1,8);k=r()<.5;stem=k?'('+a+' + '+b+') × '+c:a+' + '+b+' × '+c;ans=k?(a+b)*c:a+b*c;steps=[k?'Bracket: '+a+' + '+b+' = '+(a+b)+'.':'Multiply: '+b+' × '+c+' = '+b*c+'.',stem+' = '+ans+'.'];hint=k?'Calculate inside the brackets first.':'Multiply before adding.';break;
 case 'integers':a=I(-10-d*15,10+d*15);b=I(-10-d*10,10+d*10);k=r()<.5;stem=a+(k?' − (':' + (')+b+')';ans=k?a-b:a+b;steps=[k?'Subtracting '+b+' means adding '+(-b)+'.':'Add '+b+' to '+a+'.',stem+' = '+ans+'.'];hint=k&&b<0?'Subtracting a negative means adding its positive opposite.':'Think of movement left or right from zero.';break;
 case 'fraction-part':b=I(2,5+d*3);a=I(1,b-1);k=I(1,10+d*10);n=b*k;stem='What is '+a+'/'+b+' of '+n+'?';ans=a*k;steps=['One part: '+n+' ÷ '+b+' = '+k+'.',a+' parts: '+a+' × '+k+' = '+ans+'.'];hint='Divide by the denominator, then multiply by the numerator.';break;
 case 'fraction-add':b=I(2,5+d*3);e=I(2,5+d*3);a=I(1,b);c=I(1,e);stem=a+'/'+b+' + '+c+'/'+e;ans=(a*e+c*b)/(b*e);exact=frac(a*e+c*b,b*e);steps=['Common denominator: '+b*e+'.',a*e+'/'+b*e+' + '+c*b+'/'+b*e+' = '+exact+'.'];hint='Make equal denominators. Enter a fraction, such as 5/6.';break;
 case 'fraction-multiply':b=I(2,6+d*3);e=I(2,6+d*3);a=I(1,b);c=I(1,e);stem=a+'/'+b+' × '+c+'/'+e;ans=a*c/(b*e);exact=frac(a*c,b*e);steps=['Numerator: '+a*c+'. Denominator: '+b*e+'.','Simplified: '+exact+'.'];hint='Multiply top by top and bottom by bottom. Fractions are accepted.';break;
 case 'decimals':a=I(1,100+d*500);b=I(1,100+d*500);stem=(a/100).toFixed(2)+' + '+(b/100).toFixed(2);ans=round((a+b)/100);steps=['In hundredths: '+a+' + '+b+' = '+(a+b)+'.','In decimal form: '+ans+'.'];hint='Align decimal points and add matching place values.';break;
 case 'percent':p=P(d?[5,10,15,20,25,30,40,50,60,75,80,90]:[10,25,50]);n=I(1,10+d*40)*20;stem='What is '+p+'% of '+n+'?';ans=p*n/100;steps=[p+'% = '+p+'/100.',n+' × '+p+' ÷ 100 = '+ans+'.'];hint='Find a helpful part such as 10%, 25% or 50%.';break;
 case 'ratio':a=I(2,8);b=I(2,9+d*5);c=I(2,15+d*10);stem=a+' gears cost '+a*b+' coins. What do '+c+' identical gears cost?';ans=b*c;steps=['One gear costs '+a*b+' ÷ '+a+' = '+b+'.',c+' × '+b+' = '+ans+'.'];hint='Find the cost of one gear first.';break;
 case 'powers':a=I(2,6+d*4);n=I(2,d?3:2);k=r()<.5;stem=k?'√'+a*a:a+'^'+n;ans=k?a:a**n;steps=[k?a+' × '+a+' = '+a*a+'.':Array(n).fill(a).join(' × ')+' = '+ans+'.'];hint=k?'Which nonnegative number squares to this?':'The exponent counts how many copies of the base to multiply.';break;
 case 'averages':a=Array.from({length:P([3,5,7])},()=>I(0,10+d*40));b=[...a].sort((u,v)=>u-v);k=r()<.5;n=a.reduce((u,v)=>u+v,0);ans=k?b[(b.length-1)/2]:round(n/a.length);stem='Find the '+(k?'median':'mean')+': '+a.join(', ')+(k?'':'. Round to 2 decimal places.');steps=k?['Sorted: '+b.join(', ')+'.','The middle value is '+ans+'.']:['Sum='+n+'; count='+a.length+'.',n+' ÷ '+a.length+' ≈ '+ans+'.'];hint=k?'Sort the values and select the middle.':'Add the values and divide by their count.';break;
 case 'variables':a=I(1,5+d*5);b=I(0,10+d*10);x=I(1,5+d*5);stem='If x = '+x+', find '+a+'x + '+b+'.';ans=a*x+b;steps=['Replace x: '+a+' × '+x+' + '+b+'.','Result: '+ans+'.'];hint='Replace the letter with its number.';break;
 case 'one-step':x=I(0,10+d*15);b=I(1,10+d*10);stem='Solve: x + '+b+' = '+(x+b);ans=x;steps=['Subtract '+b+' from both sides.','x = '+(x+b)+' − '+b+' = '+x+'.'];hint='Undo the addition on both sides.';break;
 case 'two-step':x=I(d?-15:0,15+d*10);a=I(2,8+d*4);b=I(1,15+d*10);stem='Solve: '+a+'x + '+b+' = '+(a*x+b);ans=x;steps=['Subtract '+b+': '+a+'x = '+a*x+'.','Divide by '+a+': x='+x+'.'];hint='Subtract '+b+', then divide by '+a+'.';break;
 case 'both-sides':x=I(-10,10+d*10);c=I(1,6);a=c+I(1,6);b=I(1,20);e=(a-c)*x+b;stem='Solve: '+a+'x + '+b+' = '+c+'x '+sign(e);ans=x;steps=['Subtract '+c+'x and '+b+': '+(a-c)+'x = '+(e-b)+'.','Divide by '+(a-c)+': x='+x+'.'];hint='Collect x terms on one side and constants on the other.';break;
 case 'expand':a=I(2,6+d*3);b=I(1,6);c=I(1,12);e=I(1,12);stem='Expand '+a+'('+b+'x + '+c+') + '+e+'x. What is the coefficient of x?';ans=a*b+e;steps=['Distribute: '+a*b+'x + '+a*c+' + '+e+'x.','Collect x terms: coefficient = '+ans+'.'];hint='Multiply the outside number by the x coefficient inside, then add the other coefficient.';break;
 case 'linear':a=I(-5-d*3,5+d*3);b=I(-10,10);x=I(-8,8);stem='For y = '+a+'x '+sign(b)+', find y when x = '+x+'.';ans=a*x+b;steps=['Substitute: '+a+' × ('+x+') '+sign(b)+'.','y = '+ans+'.'];hint='Multiply the slope by x and add the intercept.';break;
 case 'inequality':a=I(1,6+d*3);b=I(0,12);x=I(-6,15+d*10);c=a*x+b+I(0,a-1);stem='Find the largest integer x satisfying '+a+'x + '+b+' ≤ '+c+'.';ans=x;steps=['Subtract '+b+': '+a+'x ≤ '+(c-b)+'.','Divide by '+a+' and round down: x ≤ '+x+'.'];hint='Solve the boundary, then round DOWN to a whole integer.';break;
 case 'systems':x=I(-5,10+d*10);y=I(-5,10+d*5);a=I(2,5+d);stem='Find x:\nx + y = '+(x+y)+'\n'+a+'x + y = '+(a*x+y);ans=x;steps=['Subtract the first equation: '+(a-1)+'x = '+((a-1)*x)+'.','Divide by '+(a-1)+': x='+x+'.'];hint='Subtract the first equation from the second to cancel y.';break;
 case 'quadratics':p=I(1,6+d*4);x=p+I(1,6+d*4);stem='Find the larger root: x² − '+(p+x)+'x + '+p*x+' = 0';ans=x;steps=['Numbers with sum '+(p+x)+' and product '+p*x+': '+p+' and '+x+'.','(x−'+p+')(x−'+x+')=0. Larger root: '+x+'.'];hint='Find two numbers with the indicated sum and product.';break;
 case 'exponents':a=I(1,8+d*10);b=I(1,8+d*10);k=I(0,2);stem=k===0?'x^'+a+' × x^'+b+' = x^n. Find n.':k===1?'x^'+a+' ÷ x^'+b+' = x^n, x≠0. Find n.':'(x^'+a+')^'+b+' = x^n. Find n.';ans=k===0?a+b:k===1?a-b:a*b;steps=[(k===0?'Add':k===1?'Subtract':'Multiply')+' the exponents.','n = '+ans+'.'];hint=k===0?'Add exponents for same-base multiplication.':k===1?'Subtract exponents for division.':'Multiply exponents for a power of a power.';break;
 case 'logs':b=I(2,4+d*3);k=I(1,3+d);stem='Find log_'+b+'('+b**k+').';ans=k;steps=[b+'^'+k+' = '+b**k+'.','The required exponent is '+k+'.'];hint='Ask which power of the base gives the number.';break;
 case 'sequences':a=I(1,12+d*10);b=I(2,5);n=I(3,5+d*3);k=r()<.4;stem='Find term '+n+' of the '+(k?'geometric':'arithmetic')+' sequence: '+[a,k?a*b:a+b,k?a*b*b:a+2*b].join(', ')+', …';ans=k?a*b**(n-1):a+(n-1)*b;steps=[(k?'Ratio':'Difference')+' = '+b+'.',k?a+' × '+b+'^'+(n-1)+' = '+ans+'.':a+' + '+(n-1)+' × '+b+' = '+ans+'.'];hint='Use the starting value and '+(k?'multiply by the ratio':'add the difference')+' n−1 times.';break;
 case 'composition':a=I(1,6+d*3);b=I(0,12);c=I(1,6);x=I(1,8+d*3);stem='f(x) = '+a+'x + '+b+'; g(x) = x + '+c+'.\nFind f(g('+x+')).';ans=a*(x+c)+b;steps=['g('+x+') = '+(x+c)+'.','f('+(x+c)+') = '+ans+'.'];hint='Evaluate the inner function first.';break;
 case 'combinations':n=I(3,12+d*20);stem='How many different pairs can be chosen from '+n+' people?';ans=n*(n-1)/2;steps=[n+' × '+(n-1)+' ordered selections.','Divide by 2: '+ans+' distinct pairs.'];hint='Multiply n by n−1, then halve.';break;
 case 'probability':a=I(1,8+d*10);b=I(1,8+d*10);stem='A bag has '+a+' amber and '+b+' blue tokens. Find P(amber) for one random draw.';ans=a/(a+b);exact=frac(a,a+b);steps=['Total: '+(a+b)+' equally likely tokens.','P = '+exact+'.'];hint='Favourable outcomes divided by all outcomes. Enter a fraction.';break;
 case 'determinants':a=I(-5-d*5,5+d*5);b=I(-8,8);c=I(-8,8);e=I(-8,8);stem='Find the determinant:\n[ '+a+'   '+b+' ]\n[ '+c+'   '+e+' ]';ans=a*e-b*c;steps=['Diagonal products: '+a*e+' and '+b*c+'.','Subtract: '+a*e+' − ('+b*c+') = '+ans+'.'];hint='Main diagonal product minus other diagonal product.';break;
 case 'derivatives':a=I(1,5+d*3);n=I(2,3+d);x=I(1,3+d);b=I(1,20);stem='f(x) = '+a+'x^'+n+' + '+b+'. Find f′('+x+').';ans=a*n*x**(n-1);steps=['Power rule: f′(x)='+a*n+'x^'+(n-1)+'.','At x='+x+', derivative = '+ans+'.'];hint='Multiply by the exponent, reduce the exponent by 1, then substitute.';break;
 case 'integrals':n=I(1,2+d);k=I(1,5+d*3);a=k*(n+1);b=I(1,3+d);stem='Evaluate ∫ from 0 to '+b+' of '+a+'x^'+n+' dx.';ans=k*b**(n+1);steps=['Antiderivative: '+k+'x^'+(n+1)+'.','Upper minus lower: '+k+' × '+b+'^'+(n+1)+' − 0 = '+ans+'.'];hint='Increase the exponent, divide by the new exponent, then evaluate the bounds.';break;
 case 'limits':a=I(1,10+d*15);k=I(1,5+d*3);stem='Find lim x→'+a+' of '+k+'(x² − '+a*a+') / (x − '+a+').';ans=2*k*a;steps=['Factor x²−'+a*a+' into (x−'+a+')(x+'+a+').','Cancel for x≠'+a+', then substitute: '+k+' × '+2*a+' = '+ans+'.'];hint='Use the difference of two squares; cancel before substituting.';break;
 case 'eigenvalues':a=I(-10-d*10,15+d*10);b=I(-10,10);c=I(-10,15);stem='Find the sum of eigenvalues:\n[ '+a+'   '+b+' ]\n[ 0   '+c+' ]';ans=a+c;steps=['Triangular matrix: eigenvalues '+a+' and '+c+'.','Sum (trace) = '+ans+'.'];hint='Add the diagonal entries.';break;
 case 'shapes':n=P(d?[3,4,5,6,7,8]:[3,4,5]);a={3:'triangle',4:'square',5:'pentagon',6:'hexagon',7:'heptagon',8:'octagon'}[n];stem='How many straight sides does this '+a+' have?';ans=n;steps=['Follow the outline once.','A '+a+' has '+n+' sides.'];hint='Count each straight edge once.';visual={kind:'polygon',n};break;
 case 'perimeter':a=I(1,6+d*20);b=I(1,6+d*20);stem='A rectangle is '+a+' units long and '+b+' wide. Find its perimeter.';ans=2*(a+b);steps=['Two sides of '+a+' and two of '+b+'.','2 × ('+a+' + '+b+') = '+ans+'.'];hint='Add all four sides.';visual={kind:'rectangle',a,b};break;
 case 'area':a=I(1,5+d*15);b=I(1,5+d*15);stem='Find the area of a '+a+' by '+b+' rectangle.';ans=a*b;steps=['Area = length × width.',a+' × '+b+' = '+ans+' square units.'];hint='Multiply length by width.';visual={kind:'rectangle',a,b};break;
 case 'angles':a=I(1,17)*10-(d?I(0,9):0);stem='Two angles form a straight line. One is '+a+'°. Find the other.';ans=180-a;steps=['A straight line is 180°.','180 − '+a+' = '+ans+'°.'];hint='Subtract the known angle from 180.';break;
 case 'triangle-area':a=I(1,6+d*12)*2;b=I(1,8+d*10);stem='Triangle base='+a+', perpendicular height='+b+'. Find its area.';ans=a*b/2;steps=['Base × height = '+a*b+'.','Halve it: '+ans+' square units.'];hint='Multiply base and height, then divide by 2.';visual={kind:'triangle',a,b};break;
 case 'triangle-angles':a=I(2,8)*10;b=I(2,Math.floor((170-a)/10))*10+(d?I(0,5):0);stem='Triangle angles are '+a+'°, '+b+'°, and x°. Find x.';ans=180-a-b;steps=['Known angles total '+(a+b)+'°.','180 − '+(a+b)+' = '+ans+'°.'];hint='All three angles add to 180°.';visual={kind:'triangle'};break;
 case 'polygons':n=I(3,8+d*15);stem='Find the total interior angle sum of a '+n+'-sided polygon.';ans=(n-2)*180;steps=['Split into '+(n-2)+' triangles.',(n-2)+' × 180 = '+ans+'°.'];hint='(Number of sides − 2) × 180.';break;
 case 'circumference':a=I(1,10+d*30);stem='A circle has radius '+a+'. Circumference = kπ. Find k.';ans=2*a;steps=['C = 2π × '+a+' = '+ans+'π.','k = '+ans+'.'];hint='Double the radius. Enter the coefficient of π.';visual={kind:'circle',a};break;
 case 'circle-area':a=I(1,10+d*15);stem='A circle has radius '+a+'. Area = kπ. Find k.';ans=a*a;steps=['A = π × '+a+'² = '+ans+'π.','k = '+ans+'.'];hint='Square the radius. Enter the coefficient of π.';visual={kind:'circle',a};break;
 case 'volume':a=I(1,6+d*8);b=I(1,6+d*8);c=I(1,6+d*8);stem='Find the volume of a '+a+' × '+b+' × '+c+' box.';ans=a*b*c;steps=['Base area = '+a*b+'.','Times height: '+a*b+' × '+c+' = '+ans+'.'];hint='Multiply the three dimensions.';break;
 case 'cylinder':a=I(1,6+d*7);b=I(1,10+d*15);stem='Cylinder radius='+a+', height='+b+'. Volume = kπ. Find k.';ans=a*a*b;steps=['Base-area coefficient = '+a*a+'.','Times height: k = '+ans+'.'];hint='Radius squared times height.';break;
 case 'pythagoras':a=P([[3,4,5],[5,12,13],[8,15,17],[7,24,25]]);k=I(1,2+d*4);[b,c,ans]=a.map(v=>v*k);stem='Right triangle legs are '+b+' and '+c+'. Find the hypotenuse.';steps=['c² = '+b+'² + '+c+'² = '+ans*ans+'.','Positive square root: '+ans+'.'];hint='Square both legs, add, then take the positive square root.';visual={kind:'triangle',a:b,b:c};break;
 case 'distance':x=I(-10,10);y=I(-10,10);a=x+I(1,6+d*10);b=y+I(1,6+d*10);stem='Find the SQUARED distance between ('+x+', '+y+') and ('+a+', '+b+').';ans=(a-x)**2+(b-y)**2;steps=['Changes: '+(a-x)+' and '+(b-y)+'.','Square and add: '+ans+'.'];hint='Square coordinate differences and add. Do not take a square root.';break;
 case 'slope':x=I(-10,10);y=I(-10,10);a=I(1,5+d*4);b=I(-10-d*10,10+d*10);stem='Find the slope through ('+x+', '+y+') and ('+(x+a)+', '+(y+b)+').';ans=b/a;exact=frac(b,a);steps=['Rise='+b+'; run='+a+'.','Slope='+exact+'.'];hint='Change in y divided by change in x.';break;
 case 'similarity':k=I(2,4+d*3);a=I(1,10+d*20);b=r()<.35?3:2;stem='A shape has '+(b===3?'volume':'area')+' '+a+'. All lengths scale by '+k+'. Find the new '+(b===3?'volume':'area')+'.';ans=a*k**b;steps=['Scale factor: '+k+'^'+b+' = '+k**b+'.','Multiply by '+a+': '+ans+'.'];hint=b===3?'Volume scales with the cube of the length factor.':'Area scales with the square of the length factor.';break;
 case 'trig':a=P([[3,4,5],[5,12,13],[8,15,17]]);k=I(1,3+d*5);[b,c,e]=a.map(v=>v*k);p=P(['sin','cos','tan']);x=p==='cos'?c:b;y=p==='tan'?c:e;stem='Relative to θ: opposite='+b+', adjacent='+c+', hypotenuse='+e+'. Find '+p+' θ.';ans=x/y;exact=frac(x,y);steps=[p+' uses '+(p==='sin'?'opposite/hypotenuse':p==='cos'?'adjacent/hypotenuse':'opposite/adjacent')+'.',x+'/'+y+' = '+exact+'.'];hint=p==='sin'?'Opposite / hypotenuse.':p==='cos'?'Adjacent / hypotenuse.':'Opposite / adjacent.';break;
 case 'cosine':a=I(2,10+d*10);b=I(2,10+d*10);p=P([60,90,120]);c=p===60?.5:p===90?0:-.5;stem='Sides a='+a+', b='+b+' meet at '+p+'°. Find the opposite side SQUARED.';ans=a*a+b*b-2*a*b*c;steps=['cos '+p+'° = '+c+'.','c² = a²+b²−2ab cos C = '+ans+'.'];hint='Use c²=a²+b²−2ab cos C; cos '+p+'°='+c+'.';break;
 case 'dot':a=I(-5-d*5,5+d*5);b=I(-10,10);c=I(-10,10);e=I(-10,10);stem='Find ('+a+', '+b+') · ('+c+', '+e+').';ans=a*c+b*e;steps=['Matching products: '+a*c+' and '+b*e+'.','Add: '+ans+'.'];hint='Multiply matching coordinates, then add.';break;
 case 'cross':a=I(-8-d*4,8+d*4);b=I(-10,10);c=I(-10,10);e=I(-10,10);x=I(-10,10);y=I(-10,10);stem='u=('+a+', '+b+', '+x+'), v=('+c+', '+e+', '+y+'). Find the z component of u×v.';ans=a*e-b*c;steps=['z = uₓvᵧ−uᵧvₓ.',a+' × '+e+' − '+b+' × '+c+' = '+ans+'.'];hint='Use x and y coordinates: uₓvᵧ−uᵧvₓ.';break;
 case 'planes':a=I(1,5+d*3);b=I(1,6);c=I(1,6);x=I(-6,6);y=I(-6,6);z=I(-10,10);n=a*x+b*y+c*z;stem='On '+a+'x + '+b+'y + '+c+'z = '+n+', x='+x+' and y='+y+'. Find z.';ans=z;steps=[c+'z = '+n+' − ('+a*x+') − ('+b*y+') = '+c*z+'.','Divide by '+c+': z='+z+'.'];hint='Substitute x and y, then isolate z.';break;
 case 'conics':p=I(1,10+d*30);stem='For y² = '+4*p+'x, find the x coordinate of the focus.';ans=p;steps=['Compare with y²=4px.','4p='+4*p+', so p='+p+'.'];hint='Match the x coefficient to 4p.';break;
 case 'polar':a=I(1,12+d*15)*2;p=P([0,60,90,120,180]);c={0:1,60:.5,90:0,120:-.5,180:-1}[p];stem='Polar point r='+a+', θ='+p+'°. Find its Cartesian x coordinate.';ans=a*c;steps=['x = r cos θ; cos '+p+'°='+c+'.',a+' × '+c+' = '+ans+'.'];hint='x=r cos θ; cos '+p+'°='+c+'.';break;
 case 'curvature':a=I(1,10+d*20);b=I(-20,20);stem='Find the curvature of y='+a+'x² '+sign(b)+' at x=0.';ans=2*a;steps=['f′(x)='+2*a+'x, so f′(0)=0. f″(x)='+2*a+'.','κ=|f″|/(1+f′²)^(3/2) = '+ans+'.'];hint='At the vertex f′=0. Find f″ and use the curvature formula.';break;
 default:throw Error('Unknown skill: '+id);
 }
 if(!Number.isFinite(ans))throw Error('Nonfinite answer: '+id);
 return {skill:id,key:id+'|'+stem+'|'+JSON.stringify(visual||{}),stem,answer:ans,displayAnswer:exact||fmt(ans),steps,hint,visual,difficulty:d};
}
function parseAnswer(value){
 const s=String(value).trim().replace(/−/g,'-');
 if(/^[-+]?\d+(?:\.\d+)?\s*\/\s*[-+]?\d+(?:\.\d+)?$/.test(s)){const [a,b]=s.split('/').map(Number);return b===0?null:a/b;}
 if(!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s))return null;
 const n=Number(s);return Number.isFinite(n)?n:null;
}
function correct(q,value){const n=parseAnswer(value);return n!==null&&Math.abs(n-q.answer)<=Math.max(1e-7,Math.abs(q.answer)*1e-9);}
function shuffle(a,r=Math.random){a=[...a];for(let i=a.length-1;i>0;i--){const j=ri(r,0,i);[a[i],a[j]]=[a[j],a[i]];}return a;}
function options(q,r=Math.random){
 const out=[q.displayAnswer];let attempt=0;
 while(out.length<4&&attempt++<200){
  const offset=Number.isInteger(q.answer)?ri(r,1,Math.max(3,Math.min(20,Math.ceil(Math.abs(q.answer)/3)))):pick(r,[.25,.5,1,2]);
  const n=round(q.answer+pick(r,[-1,1])*offset,4),s=fmt(n);
  if(!out.some(v=>Math.abs(parseAnswer(v)-n)<1e-7)&&!correct(q,s))out.push(s);
 }
 return shuffle(out,r);
}
function reviewUpdate(old,clean,now=Date.now()){
 const stages=[60000,600000,86400000,259200000,604800000,1814400000];
 const level=clean?Math.min(5,(old?.level??-1)+1):0;
 return {level,due:now+(clean?stages[level]:30000),last:now};
}
const api={courses,tracks,tiers,generate,parseAnswer,correct,options,seeded,round,fmt,shuffle,reviewUpdate};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Numbercraft=api;
})(typeof window!=='undefined'?window:globalThis);
